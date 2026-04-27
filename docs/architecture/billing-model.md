# LLM Billing Model

## Core Principle

LLM costs are the biggest variable expense. Instead of absorbing them, shift the cost to users on the Standard plan by requiring their own API key (BYOK - Bring Your Own Key). This makes ARYA sustainable from day one.

---

## Plans

| Plan | LLM Provider | API Key | Who Pays LLM | Platform Price |
|------|-------------|---------|--------------|---------------|
| **Standard (default)** | Anthropic (Claude) | User provides their own | User pays Anthropic directly | Free |
| **Premium (future)** | Anthropic (Claude) | ARYA's key (managed) | ARYA absorbs, charges subscription | ~$20-30/month |

---

## Standard Plan (default)

- User enters their Anthropic API key in ARYA's settings page
- Agents use that key for all LLM calls (risk analysis, opportunity evaluation, strategy reasoning)
- User pays Anthropic directly based on their token usage
- ARYA platform itself is free to use
- **Estimated user LLM cost:** ~$2-10/month on Haiku depending on scan frequency and portfolio complexity
- Only Anthropic API supported initially (Claude Haiku 4.5 for agents)
- Future scope: OpenAI, Google Gemini, open-source models (Llama, Mistral via Groq/Together)

### Implementation

- Settings page with API key input field (masked after entry)
- Key encrypted using AES-256-GCM before storing in Upstash Redis
- Encryption key stored in Vercel environment variable (`ENCRYPTION_SECRET`)
- Key validated on save (test call to Anthropic API)
- All agent LLM calls route through a server-side proxy that injects the user's key
- API key decrypted server-side only in Vercel serverless functions - never sent back to the browser
- If no key configured, agents run in "limited mode" (rule-based analysis only, no LLM reasoning)

### Limited Mode (no API key)

Users without an API key still get value:
- Scout Agent discovers opportunities using DefiLlama data (no LLM needed)
- Risk Agent uses rule-based heuristics (IL calculation, TVL thresholds, protocol age)
- No natural language reasoning or strategy explanations
- Dashboard still shows opportunities and basic risk scores
- Upgrade prompt: "Add your Anthropic API key for AI-powered risk analysis"

---

## Premium Plan (future)

- ARYA provides the LLM - user doesn't need an API key
- Higher-tier models available (Sonnet 4.6 for complex multi-protocol strategies)
- Priority agent execution (scans run more frequently)
- Advanced analytics and backtesting
- **ARYA's cost per premium user:** ~$5-15/month in LLM spend
- **Pricing:** needs to cover LLM cost + margin, likely $20-30/month

---

## Hackathon Implementation

- Single Anthropic API key configured in `.env` (our own key for the demo)
- Settings page UI exists with API key input (demonstrates the BYOK concept)
- Judges can see the billing model is thought through
- Total demo cost: ~$2-5 in Anthropic API charges

---

## Cost per User

| Plan | User's Monthly LLM Cost | ARYA's Cost per User |
|------|------------------------|---------------------|
| Standard (Haiku) | ~$2-10 | $0 |
| Standard (no key) | $0 | $0 |
| Premium (Haiku) | $0 | ~$5-10 |
| Premium (Sonnet) | $0 | ~$10-15 |

---

## Future: Multi-Provider Support

Phase 1 (hackathon): Anthropic only (Claude Haiku 4.5)
Phase 2: Add OpenAI (GPT-4o-mini as cost-efficient alternative)
Phase 3: Add open-source via Groq/Together (Llama, Mistral - cheapest option)
Phase 4: Model routing - automatically select the cheapest model that meets accuracy requirements per task
