import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: CheckResult
    auth: CheckResult
    apis: {
      finnhub: CheckResult
      yahoo: CheckResult
      sec: CheckResult
    }
  }
  uptime: number
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn'
  latency?: number
  message?: string
}

const startTime = Date.now()

export async function GET() {
  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  const checks = {
    database: await checkDatabase(),
    auth: await checkAuth(),
    apis: {
      finnhub: await checkFinnhub(),
      yahoo: await checkYahoo(),
      sec: await checkSEC(),
    },
  }

  // Determine overall status
  const allChecks = [
    checks.database,
    checks.auth,
    checks.apis.finnhub,
    checks.apis.yahoo,
    checks.apis.sec,
  ]

  const hasFail = allChecks.some(c => c.status === 'fail')
  const hasWarn = allChecks.some(c => c.status === 'warn')

  let status: HealthStatus['status'] = 'healthy'
  if (hasFail) status = 'unhealthy'
  else if (hasWarn) status = 'degraded'

  const healthStatus: HealthStatus = {
    status,
    timestamp,
    version: process.env.npm_package_version || '0.1.0',
    checks,
    uptime,
  }

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  return NextResponse.json(healthStatus, { status: httpStatus })
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    // Simple query to check database connectivity
    const { error } = await supabase.from('sessions').select('id').limit(1)

    if (error) {
      return { status: 'fail', message: error.message }
    }

    return { status: 'pass', latency: Date.now() - start }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
    }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    // Check if auth service is responding
    await supabase.auth.getSession()

    return { status: 'pass', latency: Date.now() - start }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Auth service unavailable',
    }
  }
}

async function checkFinnhub(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return { status: 'warn', message: 'API key not configured' }
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!response.ok) {
      return { status: 'warn', message: `HTTP ${response.status}` }
    }

    return { status: 'pass', latency: Date.now() - start }
  } catch (error) {
    return {
      status: 'warn',
      message: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

async function checkYahoo(): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Just check if we can reach the endpoint
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d',
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FinanceAI/1.0)',
        },
      }
    )

    if (!response.ok) {
      return { status: 'warn', message: `HTTP ${response.status}` }
    }

    return { status: 'pass', latency: Date.now() - start }
  } catch (error) {
    return {
      status: 'warn',
      message: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

async function checkSEC(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const response = await fetch(
      'https://data.sec.gov/submissions/CIK0000320193.json',
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'FinanceAI contact@example.com',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return { status: 'warn', message: `HTTP ${response.status}` }
    }

    return { status: 'pass', latency: Date.now() - start }
  } catch (error) {
    return {
      status: 'warn',
      message: error instanceof Error ? error.message : 'Request failed',
    }
  }
}
