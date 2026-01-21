import { streamText } from 'ai'
import { getModel } from '@/lib/models'
import { classifyQuery, getModelForQuery } from '@/lib/agents/classifier'
import { getStockData, formatDataForPrompt } from '@/lib/data'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the last user message for classification
  const lastMessage = messages[messages.length - 1]?.content || ''

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
- Never provide specific buy/sell recommendations
- Explain your reasoning clearly
- If data is missing, acknowledge it and explain what additional information would be helpful

Query classification: ${classification.type} (complexity: ${classification.complexity})
Detected tickers: ${classification.tickers.join(', ') || 'none'}${dataContext}`

  const result = streamText({
    model: config.model,
    maxOutputTokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
