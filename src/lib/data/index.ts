// Unified financial data service
// Combines SEC EDGAR, Finnhub, and Yahoo Finance with fallbacks

import { getKeyFinancials } from './sec-edgar'
import { getStockQuote, getCompanyProfile, getBasicFinancials, formatQuoteData, formatFinancialMetrics } from './finnhub'
import { getYahooQuote, formatYahooQuote, getHistoricalData } from './yahoo'

export interface StockData {
  ticker: string
  name?: string
  price?: number
  change?: number
  changePercent?: number
  high?: number
  low?: number
  previousClose?: number
  marketCap?: number
  industry?: string
  metrics?: {
    peRatio?: number
    pbRatio?: number
    eps?: number
    roe?: number
    roa?: number
    beta?: number
    '52WeekHigh'?: number
    '52WeekLow'?: number
    dividendYield?: number
  }
  fundamentals?: {
    revenue?: Array<{ date: string; value: number; period: string }>
    netIncome?: Array<{ date: string; value: number; period: string }>
    eps?: Array<{ date: string; value: number; period: string }>
  }
  source: 'finnhub' | 'yahoo' | 'sec'
  timestamp: string
}

export async function getStockData(ticker: string): Promise<StockData | null> {
  const normalizedTicker = ticker.toUpperCase()
  const timestamp = new Date().toISOString()

  // Try Finnhub first (best real-time data)
  const [quote, profile, financials] = await Promise.all([
    getStockQuote(normalizedTicker),
    getCompanyProfile(normalizedTicker),
    getBasicFinancials(normalizedTicker),
  ])

  if (quote && quote.c > 0) {
    const quoteData = formatQuoteData(quote, profile)
    const metricsData = financials ? formatFinancialMetrics(financials) : undefined

    return {
      ticker: normalizedTicker,
      name: quoteData.name,
      price: quoteData.price,
      change: quoteData.change,
      changePercent: quoteData.changePercent,
      high: quoteData.high,
      low: quoteData.low,
      previousClose: quoteData.previousClose,
      marketCap: quoteData.marketCap,
      industry: quoteData.industry,
      metrics: metricsData,
      source: 'finnhub',
      timestamp,
    }
  }

  // Fallback to Yahoo Finance
  const yahooQuote = await getYahooQuote(normalizedTicker)
  if (yahooQuote && yahooQuote.regularMarketPrice > 0) {
    const data = formatYahooQuote(yahooQuote)
    return {
      ticker: normalizedTicker,
      name: data.name,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      high: data.high,
      low: data.low,
      previousClose: data.previousClose,
      marketCap: data.marketCap,
      metrics: {
        peRatio: data.peRatio,
        '52WeekHigh': data['52WeekHigh'],
        '52WeekLow': data['52WeekLow'],
      },
      source: 'yahoo',
      timestamp,
    }
  }

  return null
}

export async function getFundamentalData(ticker: string) {
  const normalizedTicker = ticker.toUpperCase()

  // Get SEC EDGAR fundamental data
  const secData = await getKeyFinancials(normalizedTicker)
  if (secData) {
    return {
      ticker: normalizedTicker,
      entityName: secData.entityName,
      ...secData.financials,
      source: 'sec',
      timestamp: new Date().toISOString(),
    }
  }

  return null
}

export async function getComprehensiveData(ticker: string) {
  const [stockData, fundamentalData, historical] = await Promise.all([
    getStockData(ticker),
    getFundamentalData(ticker),
    getHistoricalData(ticker, '3mo', '1d'),
  ])

  return {
    stock: stockData,
    fundamentals: fundamentalData,
    historical: historical?.slice(-30), // Last 30 days
  }
}

export function formatDataForPrompt(data: StockData): string {
  const lines: string[] = []
  
  lines.push('Stock: ' + data.ticker + (data.name ? ' (' + data.name + ')' : ''))
  
  if (data.price !== undefined) {
    lines.push('Price: $' + data.price.toFixed(2))
    if (data.change !== undefined && data.changePercent !== undefined) {
      const sign = data.change >= 0 ? '+' : ''
      lines.push('Change: ' + sign + data.change.toFixed(2) + ' (' + sign + data.changePercent.toFixed(2) + '%)')
    }
  }

  if (data.marketCap) {
    const mcap = data.marketCap >= 1e12 ? (data.marketCap / 1e12).toFixed(2) + 'T' :
                 data.marketCap >= 1e9 ? (data.marketCap / 1e9).toFixed(2) + 'B' :
                 (data.marketCap / 1e6).toFixed(2) + 'M'
    lines.push('Market Cap: $' + mcap)
  }

  if (data.metrics) {
    const m = data.metrics
    if (m.peRatio) lines.push('P/E Ratio: ' + m.peRatio.toFixed(2))
    if (m.pbRatio) lines.push('P/B Ratio: ' + m.pbRatio.toFixed(2))
    if (m.eps) lines.push('EPS: $' + m.eps.toFixed(2))
    if (m.roe) lines.push('ROE: ' + m.roe.toFixed(2) + '%')
    if (m.beta) lines.push('Beta: ' + m.beta.toFixed(2))
    if (m.dividendYield) lines.push('Dividend Yield: ' + m.dividendYield.toFixed(2) + '%')
    if (m['52WeekHigh']) lines.push('52-Week High: $' + m['52WeekHigh'].toFixed(2))
    if (m['52WeekLow']) lines.push('52-Week Low: $' + m['52WeekLow'].toFixed(2))
  }

  lines.push('Data source: ' + data.source + ' (as of ' + data.timestamp + ')')

  return lines.join('\n')
}
