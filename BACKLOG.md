# Finance AI - Product Backlog

## Overview

This document defines the complete product backlog using Agile Epics and User Stories.

**Format:**
- **Epic**: Large feature (8-15 stories, 2-6 months)
- **User Story**: `As a <user>, I want <goal> so that <reason>`
- **Acceptance Criteria**: 2-5 testable conditions per story

**Priority Levels:**
- P0: Must have (MVP)
- P1: Should have
- P2: Nice to have

---

# Epic 1: Core Agent System

**Description:** Build the AI-powered financial research agent that can understand user queries, plan data retrieval, execute tools, and synthesize responses.

**Business Value:** Core functionality that enables users to get financial insights through natural language.

**Success Metrics:**
- Query classification accuracy > 95%
- Average response time < 5 seconds
- User satisfaction > 4/5

---

## Story 1.1: Query Classification

**As a** user
**I want** the system to understand my query type
**So that** it can respond appropriately (simple lookup vs detailed research)

**Priority:** P0

**Acceptance Criteria:**
- [ ] System classifies queries into: simple, research, complex
- [ ] Classification uses Gemini 2.0 Flash for cost efficiency
- [ ] Classification completes in < 500ms
- [ ] Accuracy > 95% on test dataset of 100 queries

**Technical Notes:**
- Model: Gemini 2.0 Flash
- Cost: ~$0.10/1M tokens

---

## Story 1.2: Simple Query Handler

**As a** user
**I want** to ask simple questions like "What's Apple's stock price?"
**So that** I get quick, direct answers

**Priority:** P0

**Acceptance Criteria:**
- [ ] Extracts ticker symbol from natural language
- [ ] Fetches real-time quote from data APIs
- [ ] Returns formatted response in < 2 seconds
- [ ] Handles invalid tickers gracefully with error message

**Technical Notes:**
- Single tool call (getQuote)
- Uses Gemini for speed

---

## Story 1.3: Research Query Planner

**As a** user
**I want** to ask research questions like "Give me Apple's financials and recent news"
**So that** I get comprehensive information

**Priority:** P0

**Acceptance Criteria:**
- [ ] Creates execution plan with required tools
- [ ] Plan is JSON formatted with steps array
- [ ] Identifies all required data sources
- [ ] Plan generation completes in < 1 second

**Technical Notes:**
- Uses PLANNER_PROMPT
- Output: `{ "steps": [{ "tool": "...", "args": {...} }] }`

---

## Story 1.4: Parallel Tool Execution

**As a** system
**I want** to execute multiple data fetches in parallel
**So that** response time is minimized

**Priority:** P0

**Acceptance Criteria:**
- [ ] Independent tool calls execute concurrently
- [ ] Uses Promise.all for parallelization
- [ ] Handles partial failures (some tools succeed, some fail)
- [ ] Returns all results with success/failure status

**Technical Notes:**
- TypeScript async/await
- Error handling per tool

---

## Story 1.5: Response Synthesis

**As a** user
**I want** the AI to synthesize data into a coherent response
**So that** I understand the information without reading raw data

**Priority:** P0

**Acceptance Criteria:**
- [ ] Uses GPT-4.1 for high-quality synthesis
- [ ] Formats numbers properly ($1.2B, 15.3%)
- [ ] Uses tables for comparisons
- [ ] Includes financial disclaimer when giving analysis
- [ ] Response is concise but thorough

**Technical Notes:**
- Model: GPT-4.1
- Cost: ~$2.00 input / $8.00 output per 1M tokens

---

## Story 1.6: Complex Query Handler

**As a** user
**I want** to ask complex questions like "Compare Apple, Microsoft, and Google's P/E ratios"
**So that** I can make informed comparisons

**Priority:** P1

**Acceptance Criteria:**
- [ ] Handles multi-company queries
- [ ] Fetches data for all companies in parallel
- [ ] Validates data completeness before synthesis
- [ ] Presents comparison in table format

**Technical Notes:**
- Uses compareStocks tool
- Validation step before synthesis

---

## Story 1.7: Data Validation

**As a** system
**I want** to validate fetched data before synthesis
**So that** users receive accurate information

**Priority:** P1

**Acceptance Criteria:**
- [ ] Checks for missing critical fields
- [ ] Detects obvious errors (negative prices, impossible ratios)
- [ ] Flags stale data (> 24h for financials)
- [ ] Logs validation issues for debugging

**Technical Notes:**
- Uses Gemini for validation (cheap)
- Output: `{ "valid": true/false, "issues": [] }`

---

## Story 1.8: Conversation Context

**As a** user
**I want** the system to remember our conversation
**So that** I can ask follow-up questions

**Priority:** P1

**Acceptance Criteria:**
- [ ] Stores last 50 messages per session
- [ ] Remembers last queried tickers
- [ ] Supports "What about Microsoft?" after asking about Apple
- [ ] Context persists across page refreshes

**Technical Notes:**
- Stored in Supabase sessions table
- JSONB for messages array

---

## Story 1.9: Streaming Responses

**As a** user
**I want** to see the response being generated in real-time
**So that** I know the system is working

**Priority:** P1

**Acceptance Criteria:**
- [ ] Response streams token by token
- [ ] Shows typing indicator during generation
- [ ] Handles stream interruption gracefully
- [ ] User can cancel mid-stream

**Technical Notes:**
- Vercel AI SDK streamText
- Server-Sent Events

---

# Epic 2: Financial Data Integration

**Description:** Integrate free financial data APIs with intelligent caching and rate limit management.

**Business Value:** Reliable, cost-free access to financial data.

**Success Metrics:**
- Data API uptime > 99%
- Cache hit rate > 70%
- Zero rate limit violations

---

## Story 2.1: SEC EDGAR Integration

**As a** system
**I want** to fetch financial statements from SEC EDGAR
**So that** users get accurate fundamental data

**Priority:** P0

**Acceptance Criteria:**
- [ ] Fetches income statement, balance sheet, cash flow
- [ ] Maps ticker to CIK number
- [ ] Parses XBRL JSON format
- [ ] Handles companies not found gracefully
- [ ] Rate limit: 10 req/sec respected

**Technical Notes:**
- Endpoint: `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`
- No API key required

---

## Story 2.2: Finnhub Integration

**As a** system
**I want** to fetch real-time quotes from Finnhub
**So that** users get current stock prices

**Priority:** P0

**Acceptance Criteria:**
- [ ] Fetches real-time price, change, volume
- [ ] Fetches company news
- [ ] Fetches basic fundamentals
- [ ] Rate limit: 60 req/min respected
- [ ] API key stored securely

**Technical Notes:**
- Free tier: 60 calls/minute
- Requires FINNHUB_API_KEY

---

## Story 2.3: Yahoo Finance Integration

**As a** system
**I want** to use Yahoo Finance as a backup data source
**So that** the system works even if other APIs fail

**Priority:** P0

**Acceptance Criteria:**
- [ ] Fetches historical prices
- [ ] Fetches basic quote data
- [ ] Works without API key
- [ ] Self-imposed rate limit: 1000 req/min

**Technical Notes:**
- Library: yahoo-finance2 (npm)
- Scraping-based, may break

---

## Story 2.4: Alpha Vantage Integration

**As a** system
**I want** to fetch technical indicators from Alpha Vantage
**So that** users can analyze stock technicals

**Priority:** P1

**Acceptance Criteria:**
- [ ] Fetches RSI, MACD, SMA, EMA, Bollinger Bands
- [ ] Rate limit: 25 req/day strictly enforced
- [ ] Falls back to local calculation when limit reached
- [ ] API key stored securely

**Technical Notes:**
- Very limited free tier
- Cache aggressively (1 hour TTL)

---

## Story 2.5: Local Technical Calculation

**As a** system
**I want** to calculate technical indicators locally
**So that** users get technicals even when API limit is reached

**Priority:** P1

**Acceptance Criteria:**
- [ ] Calculates RSI from price history
- [ ] Calculates MACD (12, 26, 9 periods)
- [ ] Calculates EMA for any period
- [ ] Results match API results within 0.1%

**Technical Notes:**
- Uses Yahoo historical data as input
- Pure TypeScript implementation

---

## Story 2.6: Rate Limiter

**As a** system
**I want** to track and enforce API rate limits
**So that** we never get blocked by providers

**Priority:** P0

**Acceptance Criteria:**
- [ ] Tracks requests per source in Redis/Supabase
- [ ] Blocks requests when limit reached
- [ ] Provides waitForSlot() for queuing
- [ ] Shows remaining calls via getRemainingCalls()

**Technical Notes:**
- Per-source configuration
- Window-based counting

---

## Story 2.7: Data Cache

**As a** system
**I want** to cache API responses
**So that** we minimize API calls and improve response time

**Priority:** P0

**Acceptance Criteria:**
- [ ] Caches with configurable TTL per data type
- [ ] Quote: 1 minute TTL
- [ ] Financials: 24 hour TTL
- [ ] Profile: 30 day TTL
- [ ] Supports stale-while-revalidate pattern

**Technical Notes:**
- Stored in Supabase financial_cache table
- JSONB for flexible data storage

---

## Story 2.8: Multi-Source Fallback

**As a** system
**I want** to automatically try backup sources when primary fails
**So that** users always get data

**Priority:** P1

**Acceptance Criteria:**
- [ ] Tries sources in priority order
- [ ] SEC EDGAR → Finnhub → Yahoo for fundamentals
- [ ] Finnhub → Yahoo for quotes
- [ ] Logs which source was used
- [ ] Returns partial data if some sources fail

**Technical Notes:**
- fetchWithFallback() pattern
- Circuit breaker for persistent failures

---

## Story 2.9: Ticker to CIK Mapping

**As a** system
**I want** to map stock tickers to SEC CIK numbers
**So that** I can fetch data from SEC EDGAR

**Priority:** P0

**Acceptance Criteria:**
- [ ] Maps common tickers (AAPL, MSFT, GOOGL, etc.)
- [ ] Caches mappings for 30 days
- [ ] Handles ticker changes (e.g., FB → META)
- [ ] Returns error for non-US stocks

**Technical Notes:**
- SEC provides ticker→CIK JSON file
- Cache locally on startup

---

# Epic 3: User Interface

**Description:** Build a modern web interface for the financial research agent.

**Business Value:** Makes the product accessible to non-technical users.

**Success Metrics:**
- Time to first interaction < 3 seconds
- Mobile usability score > 90
- Accessibility score > 95

---

## Story 3.1: Project Setup

**As a** developer
**I want** to set up the Next.js project with required dependencies
**So that** I can start building features

**Priority:** P0

**Acceptance Criteria:**
- [ ] Next.js 15 with App Router
- [ ] TypeScript configured
- [ ] Tailwind CSS 4 configured
- [ ] shadcn/ui installed
- [ ] Vercel AI SDK 6 installed
- [ ] ESLint + Prettier configured

**Technical Notes:**
```bash
npx create-next-app@latest finance-ai --typescript --tailwind --app
npx shadcn@latest init
npm install ai @ai-sdk/openai @ai-sdk/google
```

---

## Story 3.2: Chat Interface

**As a** user
**I want** a chat interface to ask questions
**So that** I can interact with the AI naturally

**Priority:** P0

**Acceptance Criteria:**
- [ ] Input field at bottom of screen
- [ ] Messages display in scrollable list
- [ ] User messages aligned right, AI messages aligned left
- [ ] Supports Enter to send, Shift+Enter for newline
- [ ] Shows loading indicator during response

**Technical Notes:**
- Vercel AI SDK useChat hook
- shadcn/ui components

---

## Story 3.3: Streaming Message Display

**As a** user
**I want** to see AI responses stream in real-time
**So that** I don't wait for the full response

**Priority:** P0

**Acceptance Criteria:**
- [ ] Text appears token by token
- [ ] Cursor/typing indicator shown
- [ ] Markdown rendered as it streams
- [ ] Tables render properly
- [ ] Code blocks syntax highlighted

**Technical Notes:**
- react-markdown for rendering
- Custom streaming component

---

## Story 3.4: Financial Dashboard

**As a** user
**I want** a dashboard showing my watched stocks
**So that** I can monitor them at a glance

**Priority:** P1

**Acceptance Criteria:**
- [ ] Shows watchlist stocks with current prices
- [ ] Color-coded gain/loss (green/red)
- [ ] Mini sparkline charts for each stock
- [ ] Click to view detailed research
- [ ] Auto-refreshes every minute

**Technical Notes:**
- Recharts for sparklines
- TanStack Query for data fetching

---

## Story 3.5: Stock Detail Page

**As a** user
**I want** a detailed page for each stock
**So that** I can see comprehensive information

**Priority:** P1

**Acceptance Criteria:**
- [ ] Shows company profile and description
- [ ] Displays key financial metrics
- [ ] Shows price chart (1D, 1W, 1M, 1Y, 5Y)
- [ ] Lists recent news articles
- [ ] Has "Ask about this stock" button

**Technical Notes:**
- Route: /research/[ticker]
- Server component for initial data

---

## Story 3.6: Price Chart

**As a** user
**I want** interactive price charts
**So that** I can visualize stock performance

**Priority:** P1

**Acceptance Criteria:**
- [ ] Line chart with configurable time range
- [ ] Shows OHLC on hover
- [ ] Zoomable and pannable
- [ ] Responsive on mobile
- [ ] Optional technical indicator overlays

**Technical Notes:**
- Recharts or TradingView widget
- Historical data from Yahoo Finance

---

## Story 3.7: Dark Mode

**As a** user
**I want** a dark mode option
**So that** I can use the app comfortably at night

**Priority:** P2

**Acceptance Criteria:**
- [ ] Toggle in settings/header
- [ ] Persists preference in localStorage
- [ ] Respects system preference by default
- [ ] Smooth transition animation
- [ ] All components styled for both modes

**Technical Notes:**
- Tailwind dark mode
- next-themes package

---

## Story 3.8: Mobile Responsive Design

**As a** user
**I want** the app to work well on mobile
**So that** I can check stocks on my phone

**Priority:** P1

**Acceptance Criteria:**
- [ ] Chat interface usable on mobile
- [ ] Dashboard cards stack vertically
- [ ] Charts resize appropriately
- [ ] Touch-friendly buttons (min 44px)
- [ ] No horizontal scroll

**Technical Notes:**
- Tailwind responsive classes
- Test on iPhone SE (smallest common)

---

## Story 3.9: Query History

**As a** user
**I want** to see my past queries
**So that** I can revisit previous research

**Priority:** P2

**Acceptance Criteria:**
- [ ] Lists past queries with timestamps
- [ ] Shows query type (simple/research/complex)
- [ ] Click to view full conversation
- [ ] Search/filter past queries
- [ ] Delete individual queries

**Technical Notes:**
- Fetches from query_log table
- Paginated list

---

# Epic 4: Authentication & User Management

**Description:** Implement user authentication and account management using Supabase.

**Business Value:** Enables personalized experience and data persistence.

**Success Metrics:**
- Sign-up conversion > 50%
- Login success rate > 99%
- Password reset completion > 80%

---

## Story 4.1: Supabase Setup

**As a** developer
**I want** to configure Supabase for the project
**So that** I can use its auth and database features

**Priority:** P0

**Acceptance Criteria:**
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Supabase client initialized
- [ ] Database schema migrated
- [ ] RLS policies applied

**Technical Notes:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

---

## Story 4.2: Email Magic Link Auth

**As a** user
**I want** to sign in with a magic link
**So that** I don't need to remember a password

**Priority:** P0

**Acceptance Criteria:**
- [ ] Enter email, receive link
- [ ] Link expires after 1 hour
- [ ] Clicking link logs user in
- [ ] Creates account if email is new
- [ ] Shows success/error messages

**Technical Notes:**
- Supabase signInWithOtp
- Email template customization

---

## Story 4.3: Google OAuth

**As a** user
**I want** to sign in with Google
**So that** I can use my existing account

**Priority:** P0

**Acceptance Criteria:**
- [ ] "Sign in with Google" button
- [ ] Redirects to Google consent screen
- [ ] Creates account on first login
- [ ] Fetches profile picture and name
- [ ] Handles OAuth errors gracefully

**Technical Notes:**
- Supabase signInWithOAuth
- Configure in Supabase dashboard

---

## Story 4.4: Auth Callback Handler

**As a** system
**I want** to handle auth callbacks
**So that** users are redirected after login

**Priority:** P0

**Acceptance Criteria:**
- [ ] Exchanges code for session
- [ ] Redirects to dashboard on success
- [ ] Redirects to login with error on failure
- [ ] Works for both magic link and OAuth

**Technical Notes:**
- Route: /auth/callback
- Uses Supabase server client

---

## Story 4.5: Protected Routes

**As a** system
**I want** to protect certain routes
**So that** only authenticated users can access them

**Priority:** P0

**Acceptance Criteria:**
- [ ] /dashboard requires auth
- [ ] /research/* requires auth
- [ ] Redirects to /login if not authenticated
- [ ] Preserves intended destination after login

**Technical Notes:**
- Middleware or layout-level check
- Supabase getUser()

---

## Story 4.6: User Profile

**As a** user
**I want** to view and edit my profile
**So that** I can manage my account

**Priority:** P2

**Acceptance Criteria:**
- [ ] Shows email and name
- [ ] Shows profile picture (if OAuth)
- [ ] Edit display name
- [ ] Shows account creation date
- [ ] Shows usage statistics

**Technical Notes:**
- Route: /settings/profile
- Supabase auth.updateUser

---

## Story 4.7: Sign Out

**As a** user
**I want** to sign out
**So that** I can secure my account

**Priority:** P0

**Acceptance Criteria:**
- [ ] Sign out button in header/menu
- [ ] Clears session on client
- [ ] Redirects to home page
- [ ] Works across all tabs

**Technical Notes:**
- Supabase signOut
- Clear any local storage

---

## Story 4.8: Session Persistence

**As a** user
**I want** to stay logged in
**So that** I don't need to sign in every time

**Priority:** P0

**Acceptance Criteria:**
- [ ] Session persists across browser restarts
- [ ] Automatically refreshes token before expiry
- [ ] Handles expired sessions gracefully
- [ ] Syncs session across tabs

**Technical Notes:**
- Supabase handles automatically
- Cookie-based sessions

---

# Epic 5: Watchlists

**Description:** Enable users to create and manage stock watchlists.

**Business Value:** Increases engagement and retention.

**Success Metrics:**
- 60% of users create at least one watchlist
- Average 5 stocks per watchlist

---

## Story 5.1: Create Watchlist

**As a** user
**I want** to create a new watchlist
**So that** I can organize stocks I'm interested in

**Priority:** P1

**Acceptance Criteria:**
- [ ] Name the watchlist
- [ ] Optionally add initial tickers
- [ ] Validates ticker symbols
- [ ] Shows success confirmation
- [ ] Limits to 10 watchlists per user

**Technical Notes:**
- Stored in watchlists table
- RLS ensures user ownership

---

## Story 5.2: Add Stock to Watchlist

**As a** user
**I want** to add a stock to my watchlist
**So that** I can track it

**Priority:** P1

**Acceptance Criteria:**
- [ ] Add from stock detail page
- [ ] Add from search results
- [ ] Select which watchlist to add to
- [ ] Prevents duplicates
- [ ] Limits to 50 stocks per watchlist

**Technical Notes:**
- Appends to tickers array
- Uses Set for deduplication

---

## Story 5.3: Remove Stock from Watchlist

**As a** user
**I want** to remove a stock from my watchlist
**So that** I can keep it organized

**Priority:** P1

**Acceptance Criteria:**
- [ ] Remove button on each stock
- [ ] Confirmation dialog
- [ ] Immediate UI update
- [ ] Handles last stock removal

**Technical Notes:**
- Filters tickers array
- Optimistic update

---

## Story 5.4: View Watchlist

**As a** user
**I want** to view all stocks in a watchlist
**So that** I can monitor them

**Priority:** P1

**Acceptance Criteria:**
- [ ] Shows all stocks with current prices
- [ ] Daily change ($ and %)
- [ ] Sortable by name, price, change
- [ ] Click to view stock detail
- [ ] Refreshes on focus

**Technical Notes:**
- Batch fetch quotes
- TanStack Query for caching

---

## Story 5.5: Delete Watchlist

**As a** user
**I want** to delete a watchlist
**So that** I can remove ones I no longer need

**Priority:** P1

**Acceptance Criteria:**
- [ ] Delete button with confirmation
- [ ] Cannot delete if only one watchlist
- [ ] Redirects to remaining watchlist
- [ ] Shows success message

**Technical Notes:**
- CASCADE delete in database
- Soft delete option?

---

## Story 5.6: Real-time Watchlist Updates

**As a** user
**I want** my watchlist to update in real-time
**So that** I see the latest prices

**Priority:** P2

**Acceptance Criteria:**
- [ ] Prices update every 60 seconds
- [ ] Visual indication of update
- [ ] Handles connection loss gracefully
- [ ] Pauses when tab is hidden

**Technical Notes:**
- Supabase real-time or polling
- Visibility API for tab detection

---

# Epic 6: Security & Compliance

**Description:** Implement security measures and financial compliance requirements.

**Business Value:** Protects users and meets regulatory requirements.

**Success Metrics:**
- Zero security incidents
- 100% compliance with disclaimers

---

## Story 6.1: Financial Disclaimer

**As a** system
**I want** to show appropriate disclaimers
**So that** users understand this is not financial advice

**Priority:** P0

**Acceptance Criteria:**
- [ ] Disclaimer on every analysis response
- [ ] Disclaimer in footer
- [ ] Disclaimer on sign-up
- [ ] Cannot be dismissed permanently

**Technical Notes:**
- "This is not financial advice. Past performance..."
- Required by FINRA regulations

---

## Story 6.2: Content Guardrails

**As a** system
**I want** to filter inappropriate financial advice
**So that** we don't expose users to harmful content

**Priority:** P0

**Acceptance Criteria:**
- [ ] Blocks specific investment recommendations
- [ ] Blocks "guaranteed returns" claims
- [ ] Blocks illegal tax strategies
- [ ] Blocks insider trading suggestions
- [ ] Logs blocked content for review

**Technical Notes:**
- Keyword filtering + LLM check
- Configurable blocklist

---

## Story 6.3: API Key Security

**As a** system
**I want** to store API keys securely
**So that** they cannot be leaked

**Priority:** P0

**Acceptance Criteria:**
- [ ] Keys stored in environment variables
- [ ] Never exposed to client
- [ ] Not logged or stored in database
- [ ] Rotatable without code changes

**Technical Notes:**
- Vercel environment variables
- Server-side only access

---

## Story 6.4: Rate Limiting (User)

**As a** system
**I want** to rate limit user requests
**So that** no single user can abuse the system

**Priority:** P1

**Acceptance Criteria:**
- [ ] 100 queries per hour per user
- [ ] 1000 queries per day per user
- [ ] Shows remaining quota to user
- [ ] Graceful error when limit reached

**Technical Notes:**
- Track in Supabase
- Reset daily at midnight UTC

---

## Story 6.5: Audit Logging

**As a** system
**I want** to log all queries and responses
**So that** we can audit usage

**Priority:** P1

**Acceptance Criteria:**
- [ ] Logs user ID, query, timestamp
- [ ] Logs response time, tokens used
- [ ] Logs tools called
- [ ] Retains logs for 90 days
- [ ] Queryable by admin

**Technical Notes:**
- query_log table
- GDPR: user can request deletion

---

## Story 6.6: Input Sanitization

**As a** system
**I want** to sanitize user inputs
**So that** prompt injection is prevented

**Priority:** P0

**Acceptance Criteria:**
- [ ] Strips potential injection patterns
- [ ] Limits query length to 1000 chars
- [ ] Validates ticker formats
- [ ] Logs suspicious inputs

**Technical Notes:**
- Basic regex filtering
- LLM-based intent classification

---

# Epic 7: Performance & Observability

**Description:** Optimize performance and implement monitoring.

**Business Value:** Ensures reliable, fast user experience.

**Success Metrics:**
- P95 response time < 5 seconds
- Uptime > 99.9%
- Error rate < 0.1%

---

## Story 7.1: Response Time Tracking

**As a** developer
**I want** to track response times
**So that** I can identify slow queries

**Priority:** P1

**Acceptance Criteria:**
- [ ] Tracks total response time
- [ ] Tracks LLM call time
- [ ] Tracks data fetch time
- [ ] Stores in query_log
- [ ] Alerts on P95 > 10 seconds

**Technical Notes:**
- Performance.now() for timing
- Structured logging

---

## Story 7.2: Error Tracking

**As a** developer
**I want** to track and alert on errors
**So that** I can fix issues quickly

**Priority:** P1

**Acceptance Criteria:**
- [ ] Captures all unhandled errors
- [ ] Includes stack trace and context
- [ ] Groups similar errors
- [ ] Alerts on error spike
- [ ] Integrates with Sentry or similar

**Technical Notes:**
- Vercel built-in or Sentry
- Source maps for debugging

---

## Story 7.3: Token Usage Tracking

**As a** developer
**I want** to track LLM token usage
**So that** I can monitor costs

**Priority:** P1

**Acceptance Criteria:**
- [ ] Tracks input and output tokens
- [ ] Tracks per model (Gemini, GPT)
- [ ] Daily/weekly/monthly aggregates
- [ ] Alerts on unusual spikes
- [ ] Estimates cost per query

**Technical Notes:**
- Store in query_log
- Dashboard for visualization

---

## Story 7.4: Cache Hit Rate Monitoring

**As a** developer
**I want** to monitor cache performance
**So that** I can optimize caching strategy

**Priority:** P2

**Acceptance Criteria:**
- [ ] Tracks cache hits vs misses
- [ ] Tracks by data type
- [ ] Shows TTL effectiveness
- [ ] Alerts if hit rate drops below 50%

**Technical Notes:**
- Log cache operations
- Daily aggregation

---

## Story 7.5: Health Check Endpoint

**As a** system
**I want** a health check endpoint
**So that** monitoring can verify the app is running

**Priority:** P1

**Acceptance Criteria:**
- [ ] Returns 200 OK when healthy
- [ ] Checks database connectivity
- [ ] Checks external API availability
- [ ] Returns detailed status in response
- [ ] Response time < 500ms

**Technical Notes:**
- Route: /api/health
- Used by uptime monitoring

---

# Summary

## Epic Overview

| Epic | Stories | Priority | Estimate |
|------|---------|----------|----------|
| 1. Core Agent System | 9 | P0 | 4 weeks |
| 2. Financial Data Integration | 9 | P0 | 3 weeks |
| 3. User Interface | 9 | P0-P2 | 4 weeks |
| 4. Authentication | 8 | P0-P2 | 2 weeks |
| 5. Watchlists | 6 | P1-P2 | 2 weeks |
| 6. Security & Compliance | 6 | P0-P1 | 2 weeks |
| 7. Performance & Observability | 5 | P1-P2 | 1 week |

## MVP Scope (P0 Stories)

**Must complete for MVP:**
- Stories 1.1-1.5 (Core agent)
- Stories 2.1-2.3, 2.6-2.7, 2.9 (Data integration)
- Stories 3.1-3.3 (Basic UI)
- Stories 4.1-4.5, 4.7-4.8 (Auth)
- Stories 6.1-6.3, 6.6 (Security)

**Total MVP Stories:** 24
**Estimated MVP Duration:** 6-8 weeks

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, Tailwind, shadcn/ui |
| AI (Fast) | Gemini 2.0 Flash |
| AI (Quality) | GPT-4.1 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Data APIs | SEC EDGAR, Finnhub, Yahoo Finance |
| Deployment | Vercel |

---

## Monthly Cost Estimate

| Item | Cost |
|------|------|
| Gemini 2.0 Flash | ~$5 |
| GPT-4.1 | ~$45 |
| Supabase (Free tier) | $0 |
| Vercel (Pro) | $20 |
| Data APIs | $0 |
| **Total** | **~$70/month** |

*Based on 100 queries/day*
