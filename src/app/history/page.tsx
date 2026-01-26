import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HistoryView } from '@/components/history/history-view'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <HistoryView userId={user.id} userEmail={user.email || ''} />
}

export const metadata = {
  title: 'Query History | Finance AI',
  description: 'View your past queries and research history',
}
