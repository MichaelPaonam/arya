# User Data Persistence

## Storage Strategy

### Hackathon (now)

- **Upstash Redis** for user sessions, API key storage, and preferences (serverless, free tier, native Vercel integration)
- **0G Storage** for all agent state (sponsor integration requirement)
- Wallet-based authentication via SIWE (Sign-In With Ethereum)
- Strategy history stored as JSON blobs keyed by strategy ID in 0G Storage

### Post-Hackathon v1 (SaaS)

- **Postgres (Supabase or Vercel)** for user accounts, portfolio tracking, and computed aggregates
  - Supabase: 500MB Postgres, 50K monthly active users, auth built in
  - Row-level security for multi-tenant isolation
- **Upstash Redis** remains for sessions, caching, and rate limiting
- **0G Storage** remains for agent memory and on-chain audit trail (decentralized, verifiable)
- Separation of concerns: relational data in Postgres, sessions/cache in Redis, agent data on 0G

### Post-Hackathon v2 (scale)

- Time-series DB (TimescaleDB or InfluxDB) for high-frequency P&L and yield tracking
- Analytics pipeline for strategy backtesting across historical data
- Multi-tenant architecture with per-user agent configurations

---

## Authentication Flow (SIWE + Redis)

```
1. User clicks "Connect Wallet" (RainbowKit modal)
         |
2. RainbowKit connects wallet via wagmi
         |
3. Frontend requests nonce from /api/auth/nonce
         |
4. Backend generates random nonce, stores in Redis (TTL: 5 min)
         |
5. Frontend constructs SIWE message with nonce, wallet signs
         |
6. Frontend sends signature + message to /api/auth/verify
         |
7. Backend verifies signature, consumes nonce, creates session
         |
8. Session token in httpOnly cookie, session data in Redis (TTL: 7 days)
         |
9. User is authenticated - dashboard loads with their data
```

### Auth API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/nonce` | GET | Generate random nonce (stored in Redis, 5min TTL) |
| `/api/auth/verify` | POST | Verify SIWE signature, consume nonce, create session |
| `/api/auth/session` | GET | Return current session data (or 401) |
| `/api/auth/logout` | POST | Invalidate session in Redis, clear cookie |

### Libraries

| Package | Purpose |
|---------|---------|
| `siwe` | SIWE message construction + signature verification |
| `@upstash/redis` | Serverless Redis client (REST-based, Vercel Edge/Serverless compatible) |
| `rainbowkit` | Wallet connection UI (already in stack) |
| `wagmi` | `signMessage` hook for SIWE signing (already in stack) |

---

## Redis Data Model (Upstash)

### Key Structure

```
arya:nonce:{nonce}                    -> wallet_address     (TTL: 5 min)
arya:session:{sessionId}              -> JSON session blob  (TTL: 7 days)
arya:user:{walletAddress}             -> JSON user blob     (persistent)
arya:user:{walletAddress}:strategies  -> JSON array         (persistent)
```

### Session Object

```json
{
  "wallet_address": "0x...",
  "created_at": 1714300000,
  "expires_at": 1714904800,
  "last_active": 1714300000
}
```

### User Object

```json
{
  "wallet_address": "0x...",
  "plan_type": "standard",
  "risk_threshold": 7,
  "anthropic_api_key_encrypted": "enc:...",
  "preferences": {
    "preferred_protocols": ["uniswap-v3", "aave"],
    "allocation_targets": {}
  },
  "created_at": 1714300000,
  "updated_at": 1714300000
}
```

### API Key Encryption

- Encrypt Anthropic API key using AES-256-GCM before storing in Redis
- Encryption key stored in Vercel environment variable (`ENCRYPTION_SECRET`)
- Decryption happens server-side only in Vercel serverless functions when agents need the key
- API key never sent back to the browser after initial save

---

## What Users Need to Track

| Data | Purpose | Access Pattern |
|------|---------|----------------|
| Portfolio positions | Current LP positions, staking, lending across protocols | Read frequently, update on execution |
| Strategy history | Every proposed, approved, rejected, executed strategy | Append-only log, query by date/status |
| P&L records | Actual returns vs predicted per strategy | Write on outcome, read for dashboard/analytics |
| Win/loss metrics | Success rate, avg return, best/worst strategies | Computed aggregates, updated per outcome |
| Agent performance | Which agent recommended what, accuracy over time | Read for trust scoring, write per outcome |
| User preferences | Risk threshold, preferred protocols, Anthropic API key (encrypted) | Read on every scan cycle, rarely written |
| Failed strategies | Why strategies failed (slippage, pool drained, IL exceeded threshold) | Append-only, query for pattern analysis |

---

## Data Model (Postgres - Post-Hackathon)

```sql
-- User accounts (wallet-based auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'standard',  -- standard | premium
  risk_threshold INTEGER DEFAULT 7,            -- 1-10 scale
  preferences JSONB DEFAULT '{}',
  anthropic_api_key_encrypted TEXT,            -- encrypted at rest
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Strategy proposals and outcomes
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'proposed',     -- proposed | approved | rejected | executed | failed
  opportunity JSONB NOT NULL,                  -- OpportunityFound data
  risk_score NUMERIC,
  estimated_apy NUMERIC,
  actual_apy NUMERIC,                          -- filled after outcome
  proposed_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  outcome_recorded_at TIMESTAMPTZ
);

-- Active and closed positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  strategy_id UUID REFERENCES strategies(id),
  protocol TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  token_pair TEXT[] NOT NULL,
  entry_amount NUMERIC NOT NULL,
  current_value NUMERIC,
  pnl NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',       -- active | closed
  keeper_workflow_id TEXT,                      -- KeeperHub workflow tracking
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Agent prediction accuracy tracking
CREATE TABLE agent_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,                      -- iNFT token ID
  strategy_id UUID REFERENCES strategies(id),
  predicted_apy NUMERIC NOT NULL,
  actual_apy NUMERIC NOT NULL,
  deviation NUMERIC GENERATED ALWAYS AS (actual_apy - predicted_apy) STORED,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Post-mortem on failed strategies
CREATE TABLE failed_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  failure_reason TEXT NOT NULL,
  failure_stage TEXT NOT NULL,                 -- execution | monitoring | slippage | liquidation
  details JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Storage Cost Impact

| Service | Hackathon | Post-Hackathon | Notes |
|---------|-----------|----------------|-------|
| Upstash Redis | Free (10K cmds/day, 256MB) | ~$5-10/mo (pay-as-you-go) | Sessions, cache, API keys |
| Supabase Postgres | Not used | Free (500MB, 50K MAU) | Relational data, analytics |
| Vercel Postgres | Not used | 256MB (Pro plan) | Alternative to Supabase |
| TimescaleDB Cloud | Not used | 30-day trial | Only at scale |

**Hackathon cost: $0** using Upstash free tier.
