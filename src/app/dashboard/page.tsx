import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardView userId={user.id} userEmail={user.email || ''} />
}

export const metadata = {
  title: 'Dashboard | Finance AI',
  description: 'Your financial dashboard with watchlists and market overview',
}
