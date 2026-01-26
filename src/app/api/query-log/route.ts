import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQueryHistory, getUserStats } from '@/lib/audit-log'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const includeStats = searchParams.get('stats') === 'true'

  const history = getQueryHistory(user.id, limit, offset)

  const response: {
    queries: typeof history
    stats?: ReturnType<typeof getUserStats>
  } = { queries: history }

  if (includeStats) {
    response.stats = getUserStats(user.id)
  }

  return NextResponse.json(response)
}
