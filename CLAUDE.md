# Finance AI

Next.js 15 financial research assistant. Users ask natural language questions about stocks; the system fetches real-time and fundamental data from multiple sources and synthesizes AI-powered responses.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **AI**: Vercel AI SDK 6, Gemini 2.0 Flash (classification/cheap), GPT-4.1 (synthesis/quality)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Data Sources**: Finnhub (real-time, 60/min), SEC EDGAR (fundamentals, no key), Yahoo Finance (backup)
- **Styling**: Tailwind CSS 4, shadcn/ui

## Architecture

```
User Query → Sanitize → Classify (Gemini) → Fetch Data (parallel) → Synthesize (GPT-4.1) → Stream Response
```

Key modules:
- `src/lib/agents/classifier.ts` - Query classification and model routing
- `src/lib/data/` - Unified data aggregator with Finnhub → SEC EDGAR → Yahoo fallback
- `src/lib/sanitize.ts` - Prompt injection defense and input validation
- `src/lib/cache.ts` - TTL-based cache with stale-while-revalidate
- `src/lib/rate-limiter.ts` - Per-source and per-user rate limiting
- `src/lib/audit-log.ts` - Compliance logging (in-memory, needs Supabase migration)
- `src/app/api/chat/route.ts` - Main streaming chat endpoint

## Development

```bash
npm install
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint
```

Required env vars: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `FINNHUB_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Key Conventions

- Financial disclaimers required on all analysis responses
- Ticker validation: `^[A-Z]{1,5}$` (US stocks only)
- Cache TTLs: quotes 1min, financials 24h, profiles 30d
- All user data behind Supabase RLS policies
- Never expose API keys to client components

## Parallelization: Subagents vs Agent Teams

This project supports both subagents and agent teams for parallel work. Choose based on the task:

### Decision Matrix

| Task | Use Subagents | Use Agent Teams |
|------|:---:|:---:|
| Focused lookup/research (result-only) | **Yes** | No |
| Running tests/lint in parallel | **Yes** | No |
| Same-file or sequential edits | **Yes** | No |
| Multi-perspective code review | No | **Yes** |
| Competing hypothesis debugging | No | **Yes** |
| Cross-layer feature (frontend + backend + data) | No | **Yes** |
| Research debate (architecture, library choice) | No | **Yes** |
| Sprint: parallel independent modules | No | **Yes** |

**Rule of thumb**: Subagents for 90% of tasks (lower cost, result-only). Agent teams when teammates need to communicate, challenge each other, or own distinct file sets.

### Agent Teams Key Concepts

- **Team lead**: Your main session. Creates team, assigns tasks, synthesizes results.
- **Teammates**: Independent Claude Code instances, each with own context window.
- **Delegate mode** (Shift+Tab): Restricts lead to coordination only—no direct code edits.
- **Plan approval**: Require teammates to plan before implementing; lead approves/rejects.
- **Shared task list**: Tasks with dependencies. Teammates self-claim unblocked tasks.
- **Inter-agent messaging**: Teammates message each other directly (not just back to lead).

### Best Practices

- Give each teammate distinct file ownership to avoid conflicts
- Target 5-6 tasks per teammate for optimal throughput
- Include full context in spawn prompts (teammates don't inherit lead's conversation history)
- Start with research/review tasks if new to teams (clear boundaries, no file conflicts)
- Use delegate mode for complex coordination where lead shouldn't write code

### Limitations

- No session resumption for teammates (`/resume` won't restore them)
- One team per session; clean up before starting another
- No nested teams (teammates can't spawn their own teams)
- Lead is fixed for the team's lifetime

### Pre-Configured Team Compositions

See `.claude/skills/AGENTS.md` for ready-to-use team configurations tailored to this project.

## Reference Documentation

- `BACKLOG.md` - Product backlog with 7 epics, 52 user stories
- `DEXTER_ANALYSIS.md` - Architecture analysis, model selection rationale, API recommendations
