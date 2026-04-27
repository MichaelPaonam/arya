# Agent Orchestration & Knowledge Base: Architecture Decisions

## Do We Need a RAG Vector DB?

**Short answer: No. Not for the hackathon, and probably not for v1 of ARYA.**

### Why RAG/Vector DB is typically used
RAG (Retrieval-Augmented Generation) with a vector DB is useful when you have:
- Large unstructured text corpora that agents need to search semantically
- Documents that change frequently and need to be queried by meaning, not keywords
- Knowledge that doesn't fit in an LLM's context window

### Why ARYA doesn't need it

| ARYA's Data | Format | Access Method | Vector DB Needed? |
|-------------|--------|---------------|-------------------|
| Yield farming opportunities | Structured JSON from DefiLlama API | Direct API calls | No - structured data, not text |
| Pool data (APY, TVL, tokens) | Structured JSON/numbers | DefiLlama + Uniswap API | No - numerical, not semantic |
| Risk scores | Computed numbers | Agent calculates in real-time | No - generated, not retrieved |
| Strategy history | Structured records | 0G Storage (key-value) | No - exact lookups, not fuzzy search |
| Agent decisions | Structured audit trail | On-chain via smart contracts | No - deterministic queries |

ARYA's data is **structured and numerical**, not unstructured text. The Scout Agent queries DefiLlama for pool data (JSON), the Risk Agent runs calculations on numbers, and results are stored as structured records on 0G Storage. There's no "search a corpus of documents by semantic meaning" use case.

### When ARYA would need RAG
- If we added a feature to analyze protocol documentation/audits for risk assessment
- If we wanted agents to learn from DeFi research papers or governance proposals
- If we built a natural language query interface ("find me pools similar to X")

None of these are in scope for the hackathon.

### Verdict
**Skip the vector DB.** It would add complexity (embedding pipeline, chunking strategy, DB setup) without solving a problem we actually have. Our data is already structured and queryable via APIs.

If needed later, **ChromaDB** (open-source, lightweight, runs in-process) would be the right choice for a small project. But not now.

---

## Multi-Agent Orchestration: LangGraph vs Alternatives

### Options Evaluated

| Framework | Language | Architecture | Complexity | Hackathon Fit |
|-----------|----------|-------------|------------|---------------|
| **LangGraph.js** | TypeScript | Graph-based (StateGraph, nodes, edges) | Medium | Good |
| **CrewAI** | Python (primarily) | Role-based (agents, tasks, crew) | Low | Poor (Python, less control) |
| **AutoGen** | Python | Conversation-based (agents chat) | Medium | Poor (Python) |
| **Custom orchestrator** | TypeScript | Whatever we design | Low-Medium | Best |

### LangGraph.js - Strong Candidate

**Pros:**
- First-class TypeScript support
- Graph-based workflow matches ARYA's pipeline (Scout → Risk → Orchestrator → Executor)
- Built-in state management with checkpointing (agent state persists across runs)
- Native human-in-the-loop support (pause at approval step, resume after user decision)
- Conditional routing (e.g., skip Executor if Risk score too high)
- Streaming support for real-time dashboard updates
- Well-maintained, used in production by Coinbase, Uber, etc.

**Cons:**
- Learning curve - graph primitives take time to understand
- Dependency on LangChain ecosystem (heavier than needed for 4 agents)
- Adds a layer of abstraction over what is fundamentally simple message passing
- Overkill for a hackathon where the agent logic is straightforward

**Core concepts for ARYA:**
```
StateGraph → defines the pipeline
Nodes → Scout, Risk, Orchestrator, Executor (each a function)
Edges → Scout→Risk→Orchestrator→(human approval)→Executor
Conditional edges → if riskScore > threshold, skip to rejection
State → shared object passed between nodes (opportunities, assessments, proposals)
```

### CrewAI - Not Recommended

**Why not:**
- Primarily Python (our stack is TypeScript)
- Role-based abstraction hides too much control
- KeeperHub prize track lists CrewAI integration as an option, but we can integrate KeeperHub directly via REST API without needing CrewAI as a wrapper

### Custom Orchestrator - Also Strong Candidate

**Pros:**
- Zero dependencies - lighter bundle, faster to debug
- Full control over agent communication
- Easier to explain to hackathon judges ("we built the orchestration from scratch")
- ARYA's pipeline is linear (Scout → Risk → Orchestrator → Executor) - doesn't need graph framework
- 4 agents with a simple pipeline is not complex enough to justify a framework

**Cons:**
- Must implement state management manually
- Must implement human-in-the-loop pause/resume manually
- No built-in checkpointing or streaming
- Less impressive on a tech stack slide

**What custom looks like:**
```typescript
// Simple pipeline orchestrator
class Orchestrator {
  async run(trigger: "scan" | "scheduled") {
    const opportunities = await this.scoutAgent.discover();
    const assessments = await this.riskAgent.evaluate(opportunities);
    const proposals = this.packageProposals(assessments);
    // Emit to dashboard via WebSocket, wait for user approval
    await this.waitForApproval(proposals);
    const results = await this.executorAgent.execute(approvedProposals);
    await this.store(results); // 0G Storage
  }
}
```

---

## Recommendation for ARYA

### Orchestration: LangGraph.js

**Use LangGraph.js**, but keep it thin. Here's why:

1. **Human-in-the-loop is built in** - ARYA's core feature is the approval gate. LangGraph has native `interrupt()` support that pauses the graph at a node and resumes after human input. Building this manually is doable but error-prone.

2. **State management is free** - The shared state object (opportunities, risk scores, proposals) flows naturally through the graph. No manual plumbing.

3. **Conditional routing matters** - "If risk score > threshold, auto-reject" is a conditional edge in LangGraph. Clean and declarative.

4. **Hackathon credibility** - Judges familiar with the AI agent space know LangGraph. It's a legitimate orchestration framework, not a toy.

5. **KeeperHub integration narrative** - KeeperHub's prize track mentions agent framework integrations (LangChain, CrewAI). LangGraph.js is part of the LangChain ecosystem - this strengthens the sponsor pitch.

### Knowledge Base: No Vector DB

Use **structured data stores only:**
- **0G Storage** - Agent memory, strategy history, swarm state (key-value, JSON)
- **DefiLlama API** - Real-time yield data (structured JSON)
- **Smart contracts** - On-chain audit trail (deterministic reads)

No RAG. No embeddings. No vector DB. Our data is structured, not semantic.

---

## Architecture Decision Summary

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Agent orchestration | **LangGraph.js** | Built-in HITL, state management, conditional routing. Right fit for graph-shaped pipeline |
| Knowledge base | **No vector DB** | All data is structured (JSON, numbers, on-chain). No semantic search needed |
| Agent memory | **0G Storage** | Sponsor requirement + key-value storage is sufficient |
| LLM calls | **Claude API or OpenAI** | Agent reasoning for risk analysis and opportunity evaluation |
| Data pipeline | **DefiLlama API → agents → 0G Storage** | Structured data flow, no embedding/chunking needed |

---

## Resources

- LangGraph.js docs: https://docs.langchain.com/oss/javascript/langgraph/overview
- LangGraph concepts: StateGraph, nodes, edges, conditional routing, interrupts, checkpointing
- ChromaDB (if RAG needed later): https://www.trychroma.com/
