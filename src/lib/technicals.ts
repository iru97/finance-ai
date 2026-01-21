/**
 * Technical Indicators Calculation Library
 * Pure TypeScript implementations of common technical indicators
 */

export interface PriceData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  sma: { period: number; value: number }[]
  ema: { period: number; value: number }[]
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  bollingerBands: {
    upper: number
    middle: number
    lower: number
  }
  atr: number
  stochastic: {
    k: number
    d: number
  }
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) return []

  const sma: number[] = []

  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }

  return sma
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return []

  const multiplier = 2 / (period + 1)
  const ema: number[] = []

  // First EMA is SMA
  const firstSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  ema.push(firstSMA)

  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    ema.push(value)
  }

  return ema
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period = 14): number[] {
  if (prices.length < period + 1) return []

  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  // Calculate first average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  // First RSI
  if (avgLoss === 0) {
    rsi.push(100)
  } else {
    const rs = avgGain / avgLoss
    rsi.push(100 - 100 / (1 + rs))
  }

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      const rs = avgGain / avgLoss
      rsi.push(100 - 100 / (1 + rs))
    }
  }

  return rsi
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  // Align the EMAs
  const offset = slowPeriod - fastPeriod
  const macd: number[] = []

  for (let i = 0; i < slowEMA.length; i++) {
    macd.push(fastEMA[i + offset] - slowEMA[i])
  }

  const signal = calculateEMA(macd, signalPeriod)
  const histogram: number[] = []

  const signalOffset = signalPeriod - 1
  for (let i = 0; i < signal.length; i++) {
    histogram.push(macd[i + signalOffset] - signal[i])
  }

  return { macd, signal, histogram }
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[],
  period = 20,
  standardDeviations = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = middle[i - period + 1]

    // Calculate standard deviation
    const squaredDiffs = slice.map((p) => Math.pow(p - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period
    const stdDev = Math.sqrt(avgSquaredDiff)

    upper.push(mean + standardDeviations * stdDev)
    lower.push(mean - standardDeviations * stdDev)
  }

  return { upper, middle, lower }
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(data: PriceData[], period = 14): number[] {
  if (data.length < period + 1) return []

  const trueRanges: number[] = []

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high
    const low = data[i].low
    const prevClose = data[i - 1].close

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)
  }

  // First ATR is simple average
  const atr: number[] = []
  const firstATR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
  atr.push(firstATR)

  // Subsequent ATRs use smoothing
  for (let i = period; i < trueRanges.length; i++) {
    const value = (atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period
    atr.push(value)
  }

  return atr
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(
  data: PriceData[],
  kPeriod = 14,
  dPeriod = 3
): { k: number[]; d: number[] } {
  if (data.length < kPeriod) return { k: [], d: [] }

  const kValues: number[] = []

  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1)
    const lowestLow = Math.min(...slice.map((d) => d.low))
    const highestHigh = Math.max(...slice.map((d) => d.high))
    const currentClose = data[i].close

    if (highestHigh === lowestLow) {
      kValues.push(50) // Prevent division by zero
    } else {
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
      kValues.push(k)
    }
  }

  // %D is SMA of %K
  const dValues = calculateSMA(kValues, dPeriod)

  return { k: kValues, d: dValues }
}

/**
 * Calculate all technical indicators for a stock
 */
export function calculateAllIndicators(data: PriceData[]): TechnicalIndicators | null {
  if (data.length < 26) return null // Need at least 26 data points for MACD

  const closePrices = data.map((d) => d.close)

  const sma20 = calculateSMA(closePrices, 20)
  const sma50 = calculateSMA(closePrices, 50)
  const ema12 = calculateEMA(closePrices, 12)
  const ema26 = calculateEMA(closePrices, 26)
  const rsi = calculateRSI(closePrices, 14)
  const macd = calculateMACD(closePrices)
  const bb = calculateBollingerBands(closePrices)
  const atr = calculateATR(data)
  const stochastic = calculateStochastic(data)

  // Get latest values
  const latestRSI = rsi[rsi.length - 1] || 0
  const latestMACD = {
    macd: macd.macd[macd.macd.length - 1] || 0,
    signal: macd.signal[macd.signal.length - 1] || 0,
    histogram: macd.histogram[macd.histogram.length - 1] || 0,
  }
  const latestBB = {
    upper: bb.upper[bb.upper.length - 1] || 0,
    middle: bb.middle[bb.middle.length - 1] || 0,
    lower: bb.lower[bb.lower.length - 1] || 0,
  }

  return {
    sma: [
      { period: 20, value: sma20[sma20.length - 1] || 0 },
      { period: 50, value: sma50[sma50.length - 1] || 0 },
    ],
    ema: [
      { period: 12, value: ema12[ema12.length - 1] || 0 },
      { period: 26, value: ema26[ema26.length - 1] || 0 },
    ],
    rsi: latestRSI,
    macd: latestMACD,
    bollingerBands: latestBB,
    atr: atr[atr.length - 1] || 0,
    stochastic: {
      k: stochastic.k[stochastic.k.length - 1] || 0,
      d: stochastic.d[stochastic.d.length - 1] || 0,
    },
  }
}

/**
 * Generate trading signals based on indicators
 */
export function generateSignals(indicators: TechnicalIndicators): {
  overall: 'buy' | 'sell' | 'hold'
  signals: Array<{ indicator: string; signal: 'buy' | 'sell' | 'neutral'; reason: string }>
} {
  const signals: Array<{ indicator: string; signal: 'buy' | 'sell' | 'neutral'; reason: string }> = []

  // RSI signals
  if (indicators.rsi < 30) {
    signals.push({ indicator: 'RSI', signal: 'buy', reason: 'Oversold (RSI < 30)' })
  } else if (indicators.rsi > 70) {
    signals.push({ indicator: 'RSI', signal: 'sell', reason: 'Overbought (RSI > 70)' })
  } else {
    signals.push({ indicator: 'RSI', signal: 'neutral', reason: 'Neutral range' })
  }

  // MACD signals
  if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
    signals.push({ indicator: 'MACD', signal: 'buy', reason: 'Bullish crossover' })
  } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
    signals.push({ indicator: 'MACD', signal: 'sell', reason: 'Bearish crossover' })
  } else {
    signals.push({ indicator: 'MACD', signal: 'neutral', reason: 'No clear signal' })
  }

  // Stochastic signals
  if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
    signals.push({ indicator: 'Stochastic', signal: 'buy', reason: 'Oversold' })
  } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
    signals.push({ indicator: 'Stochastic', signal: 'sell', reason: 'Overbought' })
  } else {
    signals.push({ indicator: 'Stochastic', signal: 'neutral', reason: 'Neutral range' })
  }

  // Calculate overall signal
  const buyCount = signals.filter((s) => s.signal === 'buy').length
  const sellCount = signals.filter((s) => s.signal === 'sell').length

  let overall: 'buy' | 'sell' | 'hold' = 'hold'
  if (buyCount >= 2) overall = 'buy'
  else if (sellCount >= 2) overall = 'sell'

  return { overall, signals }
}
