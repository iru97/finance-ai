# Comprehensive Analysis: Dexter Financial Research Agent

## Executive Summary

This document provides a deep analysis of [virattt/dexter](https://github.com/virattt/dexter), an autonomous financial research agent, along with research-backed recommendations to build an improved version. The analysis covers architecture, LLM selection, data sources, multi-agent patterns, UI/UX, and security.

---

## Part 1: Dexter Architecture Analysis

### Current Implementation Overview

**Core Stack:**
- Runtime: Bun (v1.0+)
- Language: TypeScript (99.2%)
- UI: React + Ink (terminal-based)
- LLM: LangChain.js (multi-provider support)
- Validation: Zod schemas
- Data: FinancialDatasets.ai API

### Agent Architecture

Dexter implements a **ReAct-style agent** with the following components:

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  MAIN AGENT LOOP (max 10 iterations)│
│  ├─ Call LLM with tools             │
│  ├─ Execute tool calls              │
│  ├─ Summarize results (compaction)  │
│  └─ Check if sufficient info        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  FINAL ANSWER GENERATION            │
│  ├─ Load full context from disk     │
│  ├─ Stream response                 │
└─────────────────────────────────────┘
```

**Key Files:**
- `src/agent/agent.ts` - Main agent loop
- `src/agent/prompts.ts` - System and iteration prompts
- `src/agent/context.ts` - Context manager (disk persistence)
- `src/agent/scratchpad.ts` - JSONL-based memory
- `src/model/llm.ts` - LLM factory and configuration
- `src/tools/finance/` - Financial data tools
- `src/tools/search/` - Tavily web search

### Strengths

1. **Context Compaction**: Stores full tool results on disk, uses summaries during iteration to reduce token usage
2. **Scratchpad Persistence**: JSONL-based append-only log enables recovery and debugging
3. **Streaming UI**: React + Ink provides real-time feedback
4. **Type Safety**: Zod schemas for all tool inputs/outputs
5. **Simple Architecture**: Easy to understand and extend

### Weaknesses

1. **Single Agent**: No specialized agents for planning, validation, or synthesis
2. **Basic ReAct Loop**: Prone to infinite loops, no sophisticated error recovery
3. **Terminal-Only UI**: Limited scalability for non-technical users
4. **Multi-Provider Complexity**: Supporting many LLMs adds maintenance burden
5. **No Guardrails**: No content filtering or compliance checks
6. **Simple Memory**: No long-term learning or semantic search
7. **Limited Error Handling**: Basic try-catch without recovery strategies

---

## Part 2: Recommended LLM Selection

### Model Selection by Task

Based on 2025-2026 benchmarks, here are the optimal models for each task:

| Task | Recommended Model | Reasoning |
|------|-------------------|-----------|
| **Planning/Reasoning** | Claude Opus 4.5 | Best for multi-step workflows, 80.9% SWE-Bench |
| **Tool Calling** | Claude Opus 4.5 | Superior agent orchestration, MCP support |
| **Financial Analysis** | Claude Opus 4.5 | Best accuracy-to-token-cost ratio for complex reasoning |
| **Summarization** | Claude 3 Haiku | $0.25/M input, excellent quality for cost |
| **Fast Validation** | Claude 3 Haiku | Quick checks, low latency |

### Why Claude Over GPT-5/Gemini for This Project

1. **SWE-Bench Leadership**: Claude Opus 4.5 scores 80.9% (vs GPT-5.2's 80.0%)
2. **Agent Workflows**: Designed for multi-step autonomous tasks
3. **Token Efficiency**: Better cost-to-quality ratio than GPT-5
4. **Prompt Injection Resistance**: Industry-leading security
5. **MCP Protocol**: Native support for Model Context Protocol

### Recommended Configuration

```typescript
// LLM Configuration
const LLM_CONFIG = {
  // Main agent reasoning and planning
  planning: {
    model: 'claude-opus-4-5-20251101',
    maxTokens: 4096,
    temperature: 0.3,
  },

  // Tool execution and validation
  execution: {
    model: 'claude-3-5-haiku-20251022',
    maxTokens: 2048,
    temperature: 0.1,
  },

  // Summarization and synthesis
  summarization: {
    model: 'claude-3-5-haiku-20251022',
    maxTokens: 1024,
    temperature: 0.2,
  },

  // Final answer generation
  synthesis: {
    model: 'claude-opus-4-5-20251101',
    maxTokens: 8192,
    temperature: 0.4,
  },
}
```

---

## Part 3: Financial Data API Recommendations

### 100% FREE Stack - Final Selection

**Total Monthly Cost: $0**

| Priority | API | Rate Limit | Best For | Why Chosen |
|----------|-----|------------|----------|------------|
| 1 | **SEC EDGAR** | 10 req/sec | Financials | NO API KEY, deepest data |
| 2 | **Finnhub** | 60/min | Real-time, news | Best free rate limit |
| 3 | **Yahoo Finance** | Unlimited | History, prices | Backup for everything |
| 4 | **Alpha Vantage** | 25/day | Technicals only | Cache aggressively |

### Selected APIs - Details

**1. SEC EDGAR (PRIMARY for fundamentals)**
```
Endpoint: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
Rate: 10 requests/second (NO API KEY NEEDED)
```
- Income statements, balance sheets, cash flow
- 18M+ filings back to 1993
- Bulk download available: `companyfacts.zip`

**2. Finnhub (PRIMARY for real-time)**
```
Endpoint: https://finnhub.io/api/v1/
Rate: 60 calls/minute free
```
- Real-time quotes, company news
- Basic fundamentals, earnings
- Crypto prices included

**3. Yahoo Finance via yfinance (BACKUP)**
```bash
pip install yfinance  # or use yahoo-finance npm
```
- Unlimited (scraping-based)
- Use as fallback when rate limited elsewhere

**4. Alpha Vantage (TECHNICALS ONLY)**
```
Rate: 25 calls/day (VERY LIMITED - cache everything)
```
- RSI, MACD, Bollinger, 50+ indicators
- Only call when user explicitly requests technicals

---

### Rate Limit Management System

```typescript
import { Redis } from 'ioredis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstAllowed: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'sec-edgar': { maxRequests: 10, windowMs: 1000, burstAllowed: 5 },
  'finnhub': { maxRequests: 60, windowMs: 60000, burstAllowed: 10 },
  'alpha-vantage': { maxRequests: 25, windowMs: 86400000, burstAllowed: 1 },
  'yfinance': { maxRequests: 1000, windowMs: 60000, burstAllowed: 50 }, // Self-imposed
};

class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async canMakeRequest(source: string): Promise<boolean> {
    const key = `ratelimit:${source}`;
    const config = RATE_LIMITS[source];
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.pexpire(key, config.windowMs);
    }

    return current <= config.maxRequests;
  }

  async waitForSlot(source: string): Promise<void> {
    while (!(await this.canMakeRequest(source))) {
      const ttl = await this.redis.pttl(`ratelimit:${source}`);
      await new Promise(r => setTimeout(r, Math.min(ttl, 1000)));
    }
  }

  async getRemainingCalls(source: string): Promise<number> {
    const current = await this.redis.get(`ratelimit:${source}`);
    const config = RATE_LIMITS[source];
    return config.maxRequests - (parseInt(current || '0'));
  }
}
```

---

### Intelligent Caching Strategy

```typescript
interface CacheConfig {
  ttl: number;        // Time-to-live in seconds
  staleWhileRevalidate: number;  // Serve stale while fetching fresh
}

const CACHE_STRATEGY: Record<string, CacheConfig> = {
  // Financials change quarterly - cache for 24h
  'financials': { ttl: 86400, staleWhileRevalidate: 3600 },

  // Prices are semi-real-time - cache for 1 minute
  'quote': { ttl: 60, staleWhileRevalidate: 30 },

  // Historical data never changes - cache for 7 days
  'history': { ttl: 604800, staleWhileRevalidate: 86400 },

  // Technicals - cache for 1 hour (computed from prices)
  'technicals': { ttl: 3600, staleWhileRevalidate: 300 },

  // News - cache for 15 minutes
  'news': { ttl: 900, staleWhileRevalidate: 300 },

  // Company profile - cache for 30 days
  'profile': { ttl: 2592000, staleWhileRevalidate: 86400 },
};

class DataCache {
  private redis: Redis;

  async get<T>(key: string, dataType: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const config = CACHE_STRATEGY[dataType];
    const age = Date.now() - timestamp;

    // Fresh data
    if (age < config.ttl * 1000) {
      return data;
    }

    // Stale but usable - trigger background refresh
    if (age < (config.ttl + config.staleWhileRevalidate) * 1000) {
      this.triggerBackgroundRefresh(key, dataType);
      return data;  // Return stale data immediately
    }

    return null;  // Too old, must fetch fresh
  }

  async set(key: string, data: unknown, dataType: string): Promise<void> {
    const config = CACHE_STRATEGY[dataType];
    const totalTTL = config.ttl + config.staleWhileRevalidate;

    await this.redis.setex(key, totalTTL, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }
}
```

---

### Smart Data Aggregator

```typescript
class FinancialDataAggregator {
  private rateLimiter: RateLimiter;
  private cache: DataCache;

  async getCompanyData(ticker: string): Promise<CompanyData> {
    const cacheKey = `company:${ticker}`;

    // Check cache first
    const cached = await this.cache.get<CompanyData>(cacheKey, 'profile');
    if (cached) return cached;

    // Priority order: SEC EDGAR → Finnhub → Yahoo
    const data = await this.fetchWithFallback(ticker, [
      { source: 'sec-edgar', fetch: () => this.fetchSEC(ticker) },
      { source: 'finnhub', fetch: () => this.fetchFinnhub(ticker) },
      { source: 'yfinance', fetch: () => this.fetchYahoo(ticker) },
    ]);

    await this.cache.set(cacheKey, data, 'profile');
    return data;
  }

  async getQuote(ticker: string): Promise<Quote> {
    const cacheKey = `quote:${ticker}`;

    const cached = await this.cache.get<Quote>(cacheKey, 'quote');
    if (cached) return cached;

    // Real-time: Finnhub first (60/min), Yahoo as backup
    const quote = await this.fetchWithFallback(ticker, [
      { source: 'finnhub', fetch: () => this.fetchFinnhubQuote(ticker) },
      { source: 'yfinance', fetch: () => this.fetchYahooQuote(ticker) },
    ]);

    await this.cache.set(cacheKey, quote, 'quote');
    return quote;
  }

  async getTechnicals(ticker: string, indicator: string): Promise<TechnicalData> {
    const cacheKey = `tech:${ticker}:${indicator}`;

    // ALWAYS check cache for Alpha Vantage (only 25/day!)
    const cached = await this.cache.get<TechnicalData>(cacheKey, 'technicals');
    if (cached) return cached;

    // Check if we have remaining Alpha Vantage calls
    const remaining = await this.rateLimiter.getRemainingCalls('alpha-vantage');

    if (remaining > 0) {
      const data = await this.fetchAlphaVantage(ticker, indicator);
      await this.cache.set(cacheKey, data, 'technicals');
      return data;
    }

    // Fallback: Calculate locally from Yahoo historical data
    const history = await this.getHistory(ticker, '1y');
    return this.calculateTechnicalLocally(history, indicator);
  }

  private async fetchWithFallback<T>(
    ticker: string,
    sources: Array<{ source: string; fetch: () => Promise<T> }>
  ): Promise<T> {
    for (const { source, fetch } of sources) {
      if (await this.rateLimiter.canMakeRequest(source)) {
        try {
          return await fetch();
        } catch (error) {
          console.warn(`${source} failed for ${ticker}, trying next...`);
          continue;
        }
      }
    }
    throw new Error(`All sources exhausted for ${ticker}`);
  }
}
```

---

### Local Technical Indicator Calculation

When Alpha Vantage rate limit is exhausted, calculate indicators locally:

```typescript
// Calculate RSI locally to save API calls
function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (i >= period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
}

// Calculate MACD locally
function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);

  const macd = emaFast.map((fast, i) => fast - emaSlow[i]);
  const signal = calculateEMA(macd, signalPeriod);
  const histogram = macd.map((m, i) => m - signal[i]);

  return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  return ema;
}
```

---

### Daily API Budget Allocation

```typescript
// Optimize 25 Alpha Vantage calls/day
const DAILY_BUDGET = {
  'alpha-vantage': {
    total: 25,
    allocation: {
      technicals: 20,      // Primary use
      intraday: 3,         // Limited intraday
      reserved: 2,         // Emergency buffer
    }
  },
  'finnhub': {
    total: 3600,           // 60/min * 60 = 3600/hour
    allocation: {
      quotes: 2000,        // Real-time prices
      news: 1000,          // Company news
      fundamentals: 500,   // Basic metrics
      reserved: 100,       // Buffer
    }
  }
};

// Track usage across the day
class BudgetTracker {
  async trackUsage(source: string, category: string): Promise<void> {
    const key = `budget:${source}:${category}:${this.getDateKey()}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400);
  }

  async getRemainingBudget(source: string, category: string): Promise<number> {
    const key = `budget:${source}:${category}:${this.getDateKey()}`;
    const used = parseInt(await this.redis.get(key) || '0');
    return DAILY_BUDGET[source].allocation[category] - used;
  }

  private getDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }
}
```

---

### API Comparison - Final Selection

| Feature | SEC EDGAR | Finnhub | Yahoo | Alpha Vantage |
|---------|-----------|---------|-------|---------------|
| **Cost** | FREE | FREE | FREE | FREE |
| **Rate** | 10/sec | 60/min | Unlimited | 25/day |
| **API Key** | NO | Yes | NO | Yes |
| **Best For** | Fundamentals | Real-time | Backup | Technicals |
| **Use When** | Always | Primary | Fallback | Cached only |

---

## Part 4: Multi-Agent Architecture

### Recommended Architecture: Specialized Agent Pattern

Replace the single ReAct agent with four specialized agents:

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│ PLANNER AGENT (Claude Opus 4.5)     │
│ ├─ Analyze query complexity         │
│ ├─ Generate step-indexed plan       │
│ ├─ Identify data requirements       │
│ └─ Output: Structured plan JSON     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ EXECUTOR AGENTS (Claude Haiku, x4)  │
│ ├─ Execute plan steps in parallel   │
│ ├─ Call financial/web tools         │
│ ├─ Handle tool-level errors         │
│ └─ Output: Raw results + metadata   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ VALIDATOR AGENT (Claude Haiku)      │
│ ├─ Verify data completeness         │
│ ├─ Check against guardrails         │
│ ├─ Validate compliance              │
│ └─ Output: Pass/Fail + issues       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ SYNTHESIZER AGENT (Claude Opus 4.5) │
│ ├─ Aggregate all results            │
│ ├─ Generate final response          │
│ ├─ Update long-term memory          │
│ └─ Output: User-friendly response   │
└─────────────────────────────────────┘
```

### Framework Recommendation: LangGraph

Choose LangGraph for orchestration because:
- Graph-based state management for complex workflows
- Built-in support for parallel execution
- LangSmith integration for observability
- Superior error recovery patterns

### Memory Architecture

```typescript
// Unified memory system
interface AgentMemory {
  // Current session (in-context)
  shortTerm: {
    currentQuery: string;
    recentToolOutputs: ToolOutput[];
    workingNotes: string;
  };

  // Persistent across sessions
  longTerm: {
    semantic: VectorStore;        // Embeddings for similarity search
    episodic: PostgreSQL;         // Event history with timestamps
    preferences: KeyValueStore;   // User preferences
  };

  // Compressed context
  summaries: {
    toolSummaries: Summary[];     // Compacted tool outputs
    sessionSummary: string;       // End-of-session summary
  };
}
```

---

## Part 5: UI/UX Architecture

### Vercel Agent Skills for Claude (January 2026)

Vercel released official **Agent Skills** - an "npm for AI agents" with 10+ years of React/Next.js expertise.

**Installation:**
```bash
npx add-skill vercel-labs/agent-skills -a claude-code
```

**Three Official Skills:**

| Skill | What It Does |
|-------|--------------|
| **react-best-practices** | 45 rules across 8 categories for React/Next.js optimization |
| **web-design-guidelines** | 100+ UI/UX audit rules for accessibility and design |
| **vercel-deploy-claimable** | Deploy to Vercel with ownership transfer |

**Key Optimization Rules (react-best-practices):**

1. **CRITICAL: Eliminating Waterfalls**
   - Sequential awaits compound network latency
   - Parallelize data fetching instead of chaining

2. **HIGH: Bundle Size Optimization**
   - Lazy load heavy modules after hydration
   - Use `typeof window !== 'undefined'` checks

3. **MEDIUM: Re-render Optimization**
   - Store callbacks in refs when used in effects
   - Lazy state initialization: `useState(() => JSON.parse(...))`

**How Skills Work:**
- Install to `~/.claude/skills/`
- Auto-activate when relevant to your task
- Claude references patterns when reviewing/writing code

### Recommended Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
├─────────────────────────────────────────────────────────┤
│ Framework:     Next.js 15 (App Router)                  │
│ UI Library:    shadcn/ui + Radix UI                     │
│ Styling:       Tailwind CSS 4                           │
│ Charts:        Recharts (dashboard) + TanStack (data)   │
│ State:         TanStack Query + Zustand                 │
│ AI Chat:       Vercel AI SDK 6 (useChat hook)           │
│ Skills:        vercel-labs/agent-skills (Claude)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                               │
├─────────────────────────────────────────────────────────┤
│ API Routes:    Next.js API Routes                       │
│ Edge:          Vercel Edge Functions (auth, routing)    │
│ Compute:       Vercel Fluid (agent orchestration)       │
│ AI:            Vercel AI SDK 6 (streamText, agents)     │
│ Database:      PostgreSQL + pgvector                    │
│ Cache:         Redis                                    │
└─────────────────────────────────────────────────────────┘
```

### Key UI Components

1. **Chat Interface**: Streaming responses with useChat hook
2. **Financial Dashboard**: Real-time charts, portfolio view
3. **Research Reports**: Markdown rendering with data tables
4. **Tool Activity**: Live view of agent actions
5. **History**: Searchable query history

### Server Components vs Client Components

```typescript
// Server Component: Data fetching and agent orchestration
// app/research/[ticker]/page.tsx
export default async function ResearchPage({ params }) {
  const financials = await fetchFinancials(params.ticker);
  const news = await fetchNews(params.ticker);

  return (
    <div>
      <FinancialOverview data={financials} />  {/* Server */}
      <NewsSection articles={news} />           {/* Server */}
      <Suspense fallback={<ChartSkeleton />}>
        <PriceChart ticker={params.ticker} />   {/* Server */}
      </Suspense>
      <ChatInterface />                         {/* Client */}
    </div>
  );
}

// Client Component: Interactive chat
// components/ChatInterface.tsx
'use client';

export function ChatInterface() {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      <MessageList messages={messages} />
      {isLoading && <StreamingIndicator />}
      <ChatInput value={input} onSubmit={handleSubmit} />
    </div>
  );
}
```

### Streaming Implementation

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: anthropic('claude-opus-4-5-20251101'),
    system: FINANCIAL_AGENT_SYSTEM_PROMPT,
    messages,
    tools: {
      getFinancials: financialsTool,
      getNews: newsTool,
      analyzeStock: analysisTool,
    },
  });

  return result.toDataStreamResponse();
}
```

---

## Part 6: Security Architecture

### Critical Security Requirements

1. **Prompt Injection Defense**
2. **Secrets Management**
3. **Rate Limiting**
4. **Guardrails & Compliance**
5. **Audit Logging**
6. **Sandboxing**

### Implementation

#### 1. Prompt Injection Defense

```typescript
// Multi-layer defense
async function processQuery(userQuery: string): Promise<Response> {
  // Layer 1: Input sanitization
  const sanitized = sanitizeInput(userQuery);

  // Layer 2: Intent classification
  const intent = await classifyIntent(sanitized);
  if (intent.isSuspicious) {
    await auditLog.recordSuspiciousQuery(userQuery);
    return createSafeResponse('Query flagged for review');
  }

  // Layer 3: Execute with guardrails
  const response = await executeWithGuardrails(sanitized);

  // Layer 4: Output filtering
  const filtered = await filterOutput(response);

  return filtered;
}
```

#### 2. Secrets Management

```typescript
// Never hardcode API keys
// Use environment variables + secrets manager

import { SecretsManager } from '@aws-sdk/client-secrets-manager';

async function getApiKey(keyName: string): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    return process.env[keyName]!;
  }

  const client = new SecretsManager();
  const secret = await client.getSecretValue({ SecretId: keyName });
  return secret.SecretString!;
}
```

#### 3. Financial Guardrails

```typescript
const FINANCIAL_GUARDRAILS = {
  blockedTopics: [
    'specific investment recommendations',
    'guaranteed returns',
    'illegal tax strategies',
    'insider trading tips',
    'market manipulation',
  ],

  requiredDisclaimers: [
    'This is not financial advice',
    'Past performance does not guarantee future results',
    'Consult a licensed financial advisor',
  ],

  validateResponse(response: string): ValidationResult {
    // Check for blocked content
    for (const topic of this.blockedTopics) {
      if (response.toLowerCase().includes(topic)) {
        return { valid: false, reason: `Contains blocked topic: ${topic}` };
      }
    }

    // Check for compliance
    if (containsSpecificAdvice(response) && !hasDisclaimer(response)) {
      return { valid: false, reason: 'Missing required disclaimer' };
    }

    return { valid: true };
  },
};
```

#### 4. Audit Logging

```typescript
interface AuditLogEntry {
  timestamp: string;
  agentId: string;
  userId: string;  // Hashed
  action: string;
  resource: string;
  decision: 'approved' | 'denied' | 'flagged';
  confidenceScore: number;
  modelVersion: string;
  durationMs: number;
  metadata: Record<string, unknown>;
}

async function logAction(entry: AuditLogEntry): Promise<void> {
  // Store in tamper-proof log
  await auditStore.append({
    ...entry,
    userId: hashPII(entry.userId),  // Never store raw PII
    signature: signEntry(entry),     // Integrity verification
  });
}
```

#### 5. Rate Limiting

```typescript
// Multi-dimensional rate limiting
const rateLimiter = new RateLimiter({
  // Per-user limits
  perUser: {
    requests: 100,
    window: '1h',
  },

  // Per-IP limits (for unauthenticated)
  perIP: {
    requests: 20,
    window: '1h',
  },

  // Cost-based limits (token budget)
  perUserTokens: {
    tokens: 100000,
    window: '24h',
  },
});

async function checkRateLimit(req: Request): Promise<boolean> {
  const userId = getUserId(req);
  const ip = getClientIP(req);

  const [userLimit, ipLimit, tokenLimit] = await Promise.all([
    rateLimiter.check('perUser', userId),
    rateLimiter.check('perIP', ip),
    rateLimiter.check('perUserTokens', userId),
  ]);

  return userLimit && ipLimit && tokenLimit;
}
```

---

## Part 7: Implementation Roadmap

### Phase 1: Core Architecture

- [ ] Set up Next.js 15 project with App Router
- [ ] Configure Vercel AI SDK 6 with Claude
- [ ] Implement basic chat interface with streaming
- [ ] Set up PostgreSQL + pgvector for memory
- [ ] Create financial data service with FMP integration
- [ ] Implement basic Planner-Executor agent pattern

### Phase 2: Multi-Agent System

- [ ] Implement LangGraph orchestration
- [ ] Create specialized Planner agent
- [ ] Create parallel Executor agents
- [ ] Create Validator agent with guardrails
- [ ] Create Synthesizer agent
- [ ] Add Redis for session state

### Phase 3: Financial Features

- [ ] Integrate multiple data sources (FMP, Finnhub, Alpha Vantage)
- [ ] Implement circuit breaker pattern
- [ ] Add technical analysis tools
- [ ] Add SEC filings integration
- [ ] Add news and sentiment analysis
- [ ] Create financial dashboard UI

### Phase 4: Security & Compliance

- [ ] Implement prompt injection defense
- [ ] Set up secrets management (AWS Secrets Manager)
- [ ] Add financial guardrails
- [ ] Implement audit logging
- [ ] Add rate limiting
- [ ] Configure GDPR compliance

### Phase 5: Production Hardening

- [ ] Add comprehensive error handling
- [ ] Implement observability (LangSmith + OpenTelemetry)
- [ ] Set up automated testing
- [ ] Configure CI/CD pipeline
- [ ] Conduct security audit
- [ ] Performance optimization

---

## Part 8: Project Structure

```
finance-ai/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts           # Chat endpoint with streaming
│   │   ├── research/
│   │   │   └── [ticker]/
│   │   │       └── route.ts       # Financial research endpoint
│   │   └── webhook/
│   │       └── route.ts           # External webhooks
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout
│   │   ├── page.tsx               # Home/portfolio
│   │   ├── research/
│   │   │   └── [ticker]/
│   │   │       └── page.tsx       # Stock research page
│   │   └── history/
│   │       └── page.tsx           # Query history
│   └── layout.tsx                 # Root layout
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx      # Main chat component
│   │   ├── MessageList.tsx        # Message display
│   │   └── StreamingMessage.tsx   # Streaming response
│   ├── dashboard/
│   │   ├── FinancialOverview.tsx  # Company overview
│   │   ├── PriceChart.tsx         # Stock price chart
│   │   └── KeyMetrics.tsx         # Financial metrics
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── agents/
│   │   ├── planner.ts             # Planner agent
│   │   ├── executor.ts            # Executor agent
│   │   ├── validator.ts           # Validator agent
│   │   ├── synthesizer.ts         # Synthesizer agent
│   │   └── orchestrator.ts        # LangGraph orchestration
│   ├── data/
│   │   ├── fmp.ts                 # Financial Modeling Prep
│   │   ├── finnhub.ts             # Finnhub API
│   │   ├── alpha-vantage.ts       # Alpha Vantage API
│   │   └── aggregator.ts          # Multi-source aggregator
│   ├── memory/
│   │   ├── short-term.ts          # Session memory
│   │   ├── long-term.ts           # Persistent memory
│   │   └── vector-store.ts        # Semantic search
│   ├── security/
│   │   ├── guardrails.ts          # Content filtering
│   │   ├── rate-limiter.ts        # Rate limiting
│   │   ├── audit-log.ts           # Compliance logging
│   │   └── sanitizer.ts           # Input sanitization
│   └── tools/
│       ├── financial.ts           # Financial tools
│       ├── search.ts              # Web search
│       └── analysis.ts            # Analysis tools
├── types/
│   └── index.ts                   # TypeScript types
└── config/
    ├── llm.ts                     # LLM configuration
    ├── data-sources.ts            # API configuration
    └── guardrails.ts              # Security rules
```

---

## Conclusion

Dexter provides a solid foundation for financial research agents, but production deployment requires significant enhancements:

1. **Simplify LLM Support**: Use Claude exclusively for optimal results
2. **Multi-Agent Architecture**: Separate concerns for reliability and cost efficiency
3. **Modern UI**: Move from terminal to web with Next.js + Vercel AI SDK
4. **Multi-Source Data**: Don't rely on a single data provider
5. **Security First**: Guardrails, audit logging, and compliance are mandatory
6. **Observability**: Instrument everything from day one

The recommended architecture reduces costs by ~30% (smaller models for execution), improves reliability to 98%+ (validation layer), and provides a scalable foundation for production deployment.
