import { streamText } from 'ai'
import { getModel } from '@/lib/models'
import { classifyQuery, getModelForQuery } from '@/lib/agents/classifier'
import { getStockData, formatDataForPrompt } from '@/lib/data'
import { sanitizeInput } from '@/lib/sanitize'

export const maxDuration = 60

const FINANCIAL_DISCLAIMER = '\n\n---\n*This is not financial advice. Data may be delayed. Always verify information and consult a qualified advisor.*'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message for classification
  const rawMessage = messages[messages.length - 1]?.content || ''

  // Sanitize user input
  const { sanitized: lastMessage, isValid, issues } = sanitizeInput(rawMessage)

  // Log issues for monitoring (in production, would use proper logging)
  if (issues.length > 0) {
    console.warn('Input sanitization issues:', { issues, originalLength: rawMessage.length })
  }

  // Block if harmful content detected
  if (!isValid) {
    return new Response('Invalid request content', { status: 400 })
  }

  // Classify the query to determine model and data needs
  const classification = await classifyQuery(lastMessage)
  const config = getModelForQuery(classification)

  // Fetch financial data if needed
  let dataContext = ''
  if (classification.requiresData && classification.tickers.length > 0) {
    const dataPromises = classification.tickers.slice(0, 3).map(async (ticker) => {
      const data = await getStockData(ticker)
      return data ? formatDataForPrompt(data) : null
    })

    const results = await Promise.all(dataPromises)
    const validResults = results.filter(Boolean)
    if (validResults.length > 0) {
      dataContext = '\n\nCurrent Financial Data:\n' + validResults.join('\n\n')
    }
  }

  const systemPrompt = `You are Finance AI, an expert financial research assistant.
You help users analyze stocks, understand financial metrics, and make informed investment decisions.

Your capabilities include:
- Analyzing company fundamentals (P/E ratio, revenue, earnings, etc.)
- Explaining financial concepts in simple terms
- Comparing companies and their performance
- Discussing market trends and news
- Providing technical analysis insights

Important guidelines:
- When financial data is provided, use it in your analysis
- Always cite your sources when discussing specific data
- Clarify when information might be outdated
- NEVER provide specific buy/sell recommendations
- NEVER claim to predict future stock prices
- NEVER suggest guaranteed returns or profits
- Explain your reasoning clearly
- If data is missing, acknowledge it and explain what additional information would be helpful
- End every substantive response with a brief disclaimer that this is not financial advice

Query classification: ${classification.type} (complexity: ${classification.complexity})
Detected tickers: ${classification.tickers.join(', ') || 'none'}${dataContext}`

  // Sanitize all message content
  const sanitizedMessages = messages.map((msg: { role: string; content: string }) => ({
    role: msg.role,
    content: msg.role === 'user' ? sanitizeInput(msg.content).sanitized : msg.content,
  }))

  const result = streamText({
    model: config.model,
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: sanitizedMessages,
  })

  return result.toTextStreamResponse()
}
