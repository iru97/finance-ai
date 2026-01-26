// Finnhub API - Free tier: 60 requests/minute
// Requires API key from https://finnhub.io

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

interface StockQuote {
  c: number  // Current price
  d: number  // Change
  dp: number // Percent change
  h: number  // High price of the day
  l: number  // Low price of the day
  o: number  // Open price of the day
  pc: number // Previous close price
  t: number  // Timestamp
}

interface CompanyProfile {
  country: string
  currency: string
  exchange: string
  ipo: string
  marketCapitalization: number
  name: string
  phone: string
  shareOutstanding: number
  ticker: string
  weburl: string
  logo: string
  finnhubIndustry: string
}

interface BasicFinancials {
  symbol: string
  metric: {
    '10DayAverageTradingVolume': number
    '52WeekHigh': number
    '52WeekLow': number
    '52WeekHighDate': string
    '52WeekLowDate': string
    'beta': number
    'bookValuePerShareAnnual': number
    'currentRatioAnnual': number
    'dividendYieldIndicatedAnnual': number
    'epsBasicExclExtraItemsAnnual': number
    'epsGrowth3Y': number
    'marketCapitalization': number
    'peBasicExclExtraTTM': number
    'pbAnnual': number
    'revenueGrowth3Y': number
    'roaRfy': number
    'roeTTM': number
  }
}

async function finnhubFetch<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('FINNHUB_API_KEY not set')
    return null
  }

  try {
    const url = FINNHUB_BASE_URL + endpoint + '&token=' + apiKey
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Finnhub API error:', error)
    return null
  }
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  return finnhubFetch<StockQuote>('/quote?symbol=' + symbol)
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  return finnhubFetch<CompanyProfile>('/stock/profile2?symbol=' + symbol)
}

export async function getBasicFinancials(symbol: string): Promise<BasicFinancials | null> {
  return finnhubFetch<BasicFinancials>('/stock/metric?symbol=' + symbol + '&metric=all')
}

export async function getStockNews(symbol: string, from?: string, to?: string) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const fromDate = from || weekAgo
  const toDate = to || today
  return finnhubFetch<Array<{
    category: string
    datetime: number
    headline: string
    id: number
    image: string
    related: string
    source: string
    summary: string
    url: string
  }>>('/company-news?symbol=' + symbol + '&from=' + fromDate + '&to=' + toDate)
}

export function formatQuoteData(quote: StockQuote, profile?: CompanyProfile | null) {
  return {
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    name: profile?.name,
    marketCap: profile?.marketCapitalization,
    industry: profile?.finnhubIndustry,
  }
}

export function formatFinancialMetrics(metrics: BasicFinancials) {
  const m = metrics.metric
  return {
    peRatio: m.peBasicExclExtraTTM,
    pbRatio: m.pbAnnual,
    eps: m.epsBasicExclExtraItemsAnnual,
    epsGrowth3Y: m.epsGrowth3Y,
    revenueGrowth3Y: m.revenueGrowth3Y,
    roe: m.roeTTM,
    roa: m.roaRfy,
    beta: m.beta,
    '52WeekHigh': m['52WeekHigh'],
    '52WeekLow': m['52WeekLow'],
    marketCap: m.marketCapitalization,
    dividendYield: m.dividendYieldIndicatedAnnual,
    currentRatio: m.currentRatioAnnual,
    bookValuePerShare: m.bookValuePerShareAnnual,
  }
}
