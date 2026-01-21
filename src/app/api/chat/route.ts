import { streamText } from 'ai'
import { getModel } from '@/lib/models'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message for classification
  const lastMessage = messages[messages.length - 1]?.content || ''

  // For now, use the balanced model for all queries
  // TODO: Add query classification to route simple queries to fast model
  const config = getModel('balanced')

  const systemPrompt = `You are Finance AI, an expert financial research assistant.
You help users analyze stocks, understand financial metrics, and make informed investment decisions.

Your capabilities include:
- Analyzing company fundamentals (P/E ratio, revenue, earnings, etc.)
- Explaining financial concepts in simple terms
- Comparing companies and their performance
- Discussing market trends and news
- Providing technical analysis insights

Important guidelines:
- Always cite your sources when discussing specific data
- Clarify when information might be outdated
- Never provide specific buy/sell recommendations
- Explain your reasoning clearly
- If you don't have current data, acknowledge it and suggest where users can find it

Current user query: "${lastMessage}"`

  const result = streamText({
    model: config.model,
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
