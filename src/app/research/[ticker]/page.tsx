import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StockDetailView } from '@/components/research/stock-detail-view'

interface Props {
  params: Promise<{ ticker: string }>
}

export default async function StockDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { ticker } = await params
  const normalizedTicker = ticker.toUpperCase()

  // Validate ticker format (1-5 uppercase letters)
  if (!/^[A-Z]{1,5}$/.test(normalizedTicker)) {
    notFound()
  }

  return (
    <StockDetailView
      ticker={normalizedTicker}
      userId={user.id}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { ticker } = await params
  return {
    title: `${ticker.toUpperCase()} - Stock Analysis | Finance AI`,
    description: `Financial analysis and research for ${ticker.toUpperCase()}`,
  }
}
