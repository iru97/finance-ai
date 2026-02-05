# Agent Team Compositions for Finance AI

Pre-configured team structures for common development scenarios. Use these as starting prompts when creating agent teams.

---

## 1. Cross-Layer Feature Implementation

**When to use**: Building a new feature that spans data layer, API, and UI (e.g., adding a new data source, building the watchlist feature, adding technical analysis views).

**Prompt**:
```
Create an agent team to implement [FEATURE]. Spawn three teammates:

1. "data-layer" - Owns src/lib/data/ and src/lib/cache.ts. Implements the data fetching,
   caching, and rate limiting for [FEATURE]. Must respect existing fallback patterns
   (Finnhub → SEC EDGAR → Yahoo) and cache TTL conventions (quotes 1min, financials 24h).

2. "api-backend" - Owns src/app/api/ and src/lib/agents/. Implements the API route and
   updates query classification if needed. Must integrate with the data layer teammate's
   exports. Depends on: data-layer completing type exports.

3. "ui-frontend" - Owns src/components/ and src/app/(pages). Builds the React components
   and page routes. Uses Tailwind + shadcn/ui. Must include financial disclaimers on
   analysis views. Depends on: api-backend completing the API route.

Require plan approval before implementation. Each teammate should run the relevant
portion of `npm run lint` on their files when done.
```

**File ownership**:
- data-layer: `src/lib/data/`, `src/lib/cache.ts`, `src/lib/rate-limiter.ts`
- api-backend: `src/app/api/`, `src/lib/agents/`
- ui-frontend: `src/components/`, `src/app/` (non-api pages), `src/hooks/`

---

## 2. Multi-Perspective Code Review

**When to use**: Reviewing a PR or a significant code change with security-sensitive financial data handling.

**Prompt**:
```
Create an agent team to review [PR/CHANGES]. Spawn three reviewers:

1. "security-reviewer" - Focus on prompt injection defense (check src/lib/sanitize.ts
   patterns), API key exposure, RLS policy correctness, and financial guardrail compliance.
   Flag any user input that reaches LLM prompts without sanitization.

2. "performance-reviewer" - Focus on API rate limit compliance, cache hit optimization,
   unnecessary re-renders in React components, and data fetching waterfall prevention.
   Check that Promise.all is used for independent fetches.

3. "correctness-reviewer" - Focus on financial data accuracy, edge cases (missing tickers,
   API failures, stale data), error handling completeness, and TypeScript type safety.
   Verify fallback chains work when upstream APIs fail.

Have each reviewer report findings with severity (critical/warning/info).
Synthesize a unified review when all are done.
```

---

## 3. Competing Hypothesis Debugging

**When to use**: A bug with unclear root cause—e.g., intermittent data staleness, incorrect financial calculations, or race conditions in the chat endpoint.

**Prompt**:
```
Users report [BUG DESCRIPTION]. Create an agent team to investigate with competing
hypotheses. Spawn 4 teammates:

1. "data-source-investigator" - Hypothesis: the bug is in the data layer. Investigate
   src/lib/data/ for API response parsing errors, cache TTL misconfiguration, or
   rate limiter false positives. Check Finnhub/SEC EDGAR/Yahoo response formats.

2. "agent-logic-investigator" - Hypothesis: the bug is in query classification or
   response synthesis. Investigate src/lib/agents/classifier.ts and
   src/app/api/chat/route.ts for incorrect routing, missing data in prompts, or
   edge cases in classification.

3. "state-investigator" - Hypothesis: the bug is in state management. Investigate
   session handling, Supabase queries, and React hooks in src/hooks/ for stale
   state, race conditions, or cache inconsistencies.

4. "environment-investigator" - Hypothesis: the bug is environmental. Check for
   missing env vars, rate limit exhaustion, API key issues, or Supabase connection
   problems.

Have teammates share findings and challenge each other's theories. Update a shared
findings document with whatever consensus emerges.
```

---

## 4. Security Audit Team

**When to use**: Before a release or after adding new user-facing features. Audits the full security surface.

**Prompt**:
```
Create an agent team to audit security for finance-ai. Spawn three teammates:

1. "input-surface-auditor" - Audit all user input paths: chat queries
   (src/app/api/chat/route.ts), ticker parameters (src/app/api/stocks/), watchlist
   mutations (src/app/api/watchlists/). Verify sanitization from src/lib/sanitize.ts
   covers all paths. Test for prompt injection bypass patterns.

2. "data-access-auditor" - Audit Supabase RLS policies in supabase/migrations/.
   Verify every table with user data has proper RLS. Check that API keys are
   server-only (never in NEXT_PUBLIC_ vars except Supabase URL/anon key).
   Review src/lib/supabase/ for auth bypass risks.

3. "compliance-auditor" - Audit financial compliance: verify disclaimers appear on
   all analysis responses (src/app/api/chat/route.ts system prompt), check that
   blocked topics in src/lib/sanitize.ts match FINRA requirements, verify audit
   logging captures all required fields in src/lib/audit-log.ts.

Require plan approval. Report all findings with severity ratings.
```

---

## 5. Data Source Integration Sprint

**When to use**: Adding a new financial data API (e.g., Alpha Vantage, FRED, or a paid provider) or overhauling the data layer.

**Prompt**:
```
Create an agent team to integrate [NEW_DATA_SOURCE]. Spawn three teammates:

1. "api-integrator" - Create the new data source module in src/lib/data/[source].ts.
   Follow existing patterns from src/lib/data/finnhub.ts: typed responses, error
   handling, rate limit awareness. Export functions matching the aggregator interface.

2. "cache-and-limits" - Update src/lib/cache.ts with appropriate TTLs for the new
   data types. Update src/lib/rate-limiter.ts with the new source's rate limits.
   Update src/lib/data/index.ts to include the new source in fallback chains.
   Depends on: api-integrator completing type exports.

3. "test-and-validate" - Write integration tests for the new source. Verify data
   format matches existing types. Test fallback behavior when the new source fails.
   Test rate limit enforcement. Depends on: cache-and-limits completing integration.

Have teammates coordinate on shared types. Require plan approval.
```

---

## 6. Research & Architecture Debate

**When to use**: Making significant architecture decisions—e.g., choosing between multi-agent patterns, evaluating new LLM providers, or deciding on state management approaches.

**Prompt**:
```
Create an agent team to evaluate [ARCHITECTURE DECISION]. Spawn three teammates:

1. "advocate" - Research and argue FOR [OPTION A]. Provide concrete evidence from
   this codebase: how it would integrate with existing patterns in src/lib/,
   estimated cost impact, and implementation complexity. Reference DEXTER_ANALYSIS.md
   and BACKLOG.md for context.

2. "skeptic" - Research and argue FOR [OPTION B]. Same requirements as advocate.
   Actively challenge the advocate's claims with counter-evidence.

3. "pragmatist" - Evaluate both options against this project's actual constraints:
   free-tier API limits, MVP timeline from BACKLOG.md, current tech stack
   (Next.js 15, Vercel AI SDK 6, Supabase). Recommend the option that ships
   faster with fewer risks.

Have all three debate and produce a decision document with: recommendation,
trade-offs, migration path, and estimated effort.
```
