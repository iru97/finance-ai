// Yahoo Finance API (via public endpoints)
// Unofficial API - use as fallback

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance'

interface YahooQuote {
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  regularMarketVolume: number
  marketCap: number
  trailingPE: number
  forwardPE: number
  priceToBook: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  averageVolume: number
  dividendYield: number
  shortName: string
  longName: string
}

export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const response = await fetch(
      `${YAHOO_BASE_URL}/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const quote = data.chart?.result?.[0]?.meta

    if (!quote) return null

    return {
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: 0, // Not available in chart API
      regularMarketChangePercent: 0,
      regularMarketDayHigh: quote.regularMarketDayHigh,
      regularMarketDayLow: quote.regularMarketDayLow,
      regularMarketOpen: 0,
      regularMarketPreviousClose: quote.chartPreviousClose,
      regularMarketVolume: quote.regularMarketVolume,
      marketCap: 0,
      trailingPE: 0,
      forwardPE: 0,
      priceToBook: 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      averageVolume: 0,
      dividendYield: 0,
      shortName: quote.shortName || symbol,
      longName: quote.longName || symbol,
    }
  } catch (error) {
    console.error('Yahoo Finance error:', error)
    return null
  }
}

export async function getHistoricalData(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
  interval: '1d' | '1wk' | '1mo' = '1d'
) {
  try {
    const response = await fetch(
      `${YAHOO_BASE_URL}/chart/${symbol}?interval=${interval}&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result) return null

    const timestamps = result.timestamp || []
    const quotes = result.indicators?.quote?.[0] || {}

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i],
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      close: quotes.close?.[i],
      volume: quotes.volume?.[i],
    }))
  } catch (error) {
    console.error('Yahoo historical data error:', error)
    return null
  }
}

export function formatYahooQuote(quote: YahooQuote) {
  return {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    high: quote.regularMarketDayHigh,
    low: quote.regularMarketDayLow,
    volume: quote.regularMarketVolume,
    previousClose: quote.regularMarketPreviousClose,
    name: quote.longName || quote.shortName,
    '52WeekHigh': quote.fiftyTwoWeekHigh,
    '52WeekLow': quote.fiftyTwoWeekLow,
    marketCap: quote.marketCap,
    peRatio: quote.trailingPE,
  }
}
