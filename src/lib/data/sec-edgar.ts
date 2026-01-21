// SEC EDGAR API - Free, no API key required
// Rate limit: 10 requests per second

const SEC_BASE_URL = 'https://data.sec.gov'
const SEC_SUBMISSIONS_URL = 'https://data.sec.gov/submissions'

interface CompanySubmission {
  cik: string
  name: string
  sic: string
  sicDescription: string
  tickers: string[]
  exchanges: string[]
  filings: {
    recent: {
      accessionNumber: string[]
      filingDate: string[]
      form: string[]
      primaryDocument: string[]
    }
  }
}

interface CompanyFacts {
  cik: number
  entityName: string
  facts: {
    'us-gaap'?: Record<string, {
      label: string
      description: string
      units: Record<string, Array<{
        end: string
        val: number
        accn: string
        fy: number
        fp: string
        form: string
        filed: string
      }>>
    }>
  }
}

// CIK lookup cache
const cikCache = new Map<string, string>()

export async function getCIKForTicker(ticker: string): Promise<string | null> {
  const normalizedTicker = ticker.toUpperCase()

  if (cikCache.has(normalizedTicker)) {
    return cikCache.get(normalizedTicker)!
  }

  try {
    const response = await fetch(`${SEC_BASE_URL}/files/company_tickers.json`, {
      headers: {
        'User-Agent': 'Finance AI Research Agent contact@example.com',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    for (const entry of Object.values(data) as Array<{ cik_str: string; ticker: string }>) {
      cikCache.set(entry.ticker, entry.cik_str.padStart(10, '0'))
    }

    return cikCache.get(normalizedTicker) || null
  } catch (error) {
    console.error('SEC CIK lookup error:', error)
    return null
  }
}

export async function getCompanySubmissions(ticker: string): Promise<CompanySubmission | null> {
  const cik = await getCIKForTicker(ticker)
  if (!cik) return null

  try {
    const response = await fetch(`${SEC_SUBMISSIONS_URL}/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'Finance AI Research Agent contact@example.com',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('SEC submissions error:', error)
    return null
  }
}

export async function getCompanyFacts(ticker: string): Promise<CompanyFacts | null> {
  const cik = await getCIKForTicker(ticker)
  if (!cik) return null

  try {
    const response = await fetch(`${SEC_BASE_URL}/api/xbrl/companyfacts/CIK${cik}.json`, {
      headers: {
        'User-Agent': 'Finance AI Research Agent contact@example.com',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('SEC company facts error:', error)
    return null
  }
}

export function extractFinancialMetric(
  facts: CompanyFacts,
  metric: string,
  form: '10-K' | '10-Q' = '10-K'
): Array<{ date: string; value: number; period: string }> {
  const usGaap = facts.facts['us-gaap']
  if (!usGaap || !usGaap[metric]) return []

  const metricData = usGaap[metric]
  const units = Object.values(metricData.units)[0] || []

  return units
    .filter(u => u.form === form)
    .map(u => ({
      date: u.end,
      value: u.val,
      period: `FY${u.fy} ${u.fp}`,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
}

// Common financial metrics to extract
export const FINANCIAL_METRICS = {
  revenue: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'],
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  eps: ['EarningsPerShareBasic', 'EarningsPerShareDiluted'],
  totalAssets: ['Assets'],
  totalLiabilities: ['Liabilities'],
  shareholderEquity: ['StockholdersEquity'],
  operatingIncome: ['OperatingIncomeLoss'],
  grossProfit: ['GrossProfit'],
}

export async function getKeyFinancials(ticker: string) {
  const facts = await getCompanyFacts(ticker)
  if (!facts) return null

  const financials: Record<string, Array<{ date: string; value: number; period: string }>> = {}

  for (const [key, possibleMetrics] of Object.entries(FINANCIAL_METRICS)) {
    for (const metric of possibleMetrics) {
      const data = extractFinancialMetric(facts, metric)
      if (data.length > 0) {
        financials[key] = data
        break
      }
    }
  }

  return {
    entityName: facts.entityName,
    cik: facts.cik,
    financials,
  }
}
