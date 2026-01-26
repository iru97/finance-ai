import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatContainer } from '@/components/chat/chat-container'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ChatContainer userId={user.id} userEmail={user.email || ''} />
}
