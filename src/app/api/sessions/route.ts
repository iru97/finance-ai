import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sessions')
    .select('id, created_at, updated_at, messages')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to include preview
  const sessions = data.map((session: { id: string; created_at: string; updated_at: string; messages: Array<{ role: string; content: string }> }) => {
    const messages = session.messages || []
    const firstUserMessage = messages.find((m: { role: string }) => m.role === 'user')
    return {
      id: session.id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      preview: firstUserMessage?.content?.slice(0, 50) || 'New conversation',
      messageCount: messages.length,
    }
  })

  return NextResponse.json(sessions)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, context } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sessions')
    .insert({
      user_id: user.id,
      messages: messages || [],
      context: context || {},
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
