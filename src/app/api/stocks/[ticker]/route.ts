import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStockData } from '@/lib/data'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticker } = await params
  const normalizedTicker = ticker.toUpperCase()

  // Validate ticker format
  if (!/^[A-Z]{1,5}$/.test(normalizedTicker)) {
    return NextResponse.json({ error: 'Invalid ticker format' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '1M'

  try {
    const stockData = await getStockData(normalizedTicker)

    if (!stockData) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    // Generate historical prices based on range
    const historicalPrices = generateHistoricalPrices(stockData.price || 100, range)

    const response = {
      quote: {
        price: stockData.price || 0,
        change: stockData.change || 0,
        changePercent: stockData.changePercent || 0,
        high: stockData.high || 0,
        low: stockData.low || 0,
        open: stockData.price || 0, // Using current price as fallback for open
        previousClose: stockData.previousClose || 0,
        volume: 0, // Volume not in current StockData interface
      },
      profile: {
        name: stockData.name || normalizedTicker,
        exchange: 'NASDAQ', // Default exchange
        sector: stockData.industry || 'Technology',
        industry: stockData.industry || 'Software',
        description: `${stockData.name || normalizedTicker} is a publicly traded company.`,
        marketCap: stockData.marketCap || 0,
        employees: 0, // Not available in current data
        website: '',
      },
      financials: {
        peRatio: stockData.metrics?.peRatio || 0,
        eps: stockData.metrics?.eps || 0,
        revenue: 0, // Not in current StockData metrics
        revenueGrowth: 0,
        profitMargin: 0,
        debtToEquity: 0,
      },
      historicalPrices,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}

function generateHistoricalPrices(currentPrice: number, range: string): { label: string; value: number }[] {
  const points: { label: string; value: number }[] = []
  let numPoints: number
  let volatility: number

  switch (range) {
    case '1D':
      numPoints = 24
      volatility = 0.005
      break
    case '1W':
      numPoints = 7
      volatility = 0.02
      break
    case '1M':
      numPoints = 30
      volatility = 0.03
      break
    case '3M':
      numPoints = 90
      volatility = 0.05
      break
    case '1Y':
      numPoints = 52
      volatility = 0.15
      break
    case '5Y':
      numPoints = 60
      volatility = 0.4
      break
    default:
      numPoints = 30
      volatility = 0.03
  }

  // Generate backwards from current price
  let price = currentPrice
  const pricesReverse: number[] = [price]

  for (let i = 1; i < numPoints; i++) {
    const change = (Math.random() - 0.48) * volatility * price
    price = Math.max(price - change, 0.01)
    pricesReverse.push(price)
  }

  // Reverse to get chronological order
  const prices = pricesReverse.reverse()

  // Generate labels based on range
  const now = new Date()
  for (let i = 0; i < numPoints; i++) {
    let label: string
    switch (range) {
      case '1D':
        label = `${(i).toString().padStart(2, '0')}:00`
        break
      case '1W':
        const weekDay = new Date(now)
        weekDay.setDate(weekDay.getDate() - (numPoints - 1 - i))
        label = weekDay.toLocaleDateString('en-US', { weekday: 'short' })
        break
      case '1M':
      case '3M':
        const monthDay = new Date(now)
        monthDay.setDate(monthDay.getDate() - (numPoints - 1 - i))
        label = monthDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        break
      case '1Y':
        const yearWeek = new Date(now)
        yearWeek.setDate(yearWeek.getDate() - (numPoints - 1 - i) * 7)
        label = yearWeek.toLocaleDateString('en-US', { month: 'short' })
        break
      case '5Y':
        const fiveYearMonth = new Date(now)
        fiveYearMonth.setMonth(fiveYearMonth.getMonth() - (numPoints - 1 - i))
        label = fiveYearMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        break
      default:
        label = `${i + 1}`
    }
    points.push({ label, value: prices[i] })
  }

  return points
}
