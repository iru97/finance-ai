import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRemainingRequests, getSourceRemainingRequests } from '@/lib/rate-limiter'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userLimits = getUserRemainingRequests(user.id)
  const sources = {
    finnhub: getSourceRemainingRequests('finnhub'),
    yahoo: getSourceRemainingRequests('yahoo'),
    sec: getSourceRemainingRequests('sec'),
  }

  return NextResponse.json({
    user: {
      hourly: {
        remaining: userLimits.hourly.remaining,
        limit: 100,
        resetAt: new Date(userLimits.hourly.resetAt).toISOString(),
      },
      daily: {
        remaining: userLimits.daily.remaining,
        limit: 1000,
        resetAt: new Date(userLimits.daily.resetAt).toISOString(),
      },
    },
    sources,
  })
}
