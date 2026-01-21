import { generateText } from 'ai'
import { getModel } from '@/lib/models'

export type QueryType =
  | 'simple_lookup'      // Stock price, basic metrics
  | 'fundamentals'       // P/E ratio, revenue, earnings
  | 'comparison'         // Compare companies
  | 'analysis'           // Deep analysis, trends
  | 'explanation'        // Explain concepts
  | 'general'            // General financial questions

export interface ClassificationResult {
  type: QueryType
  tickers: string[]
  requiresData: boolean
  complexity: 'low' | 'medium' | 'high'
}

const CLASSIFICATION_PROMPT = `You are a financial query classifier. Analyze the user query and respond with a JSON object.

Query types:
- simple_lookup: Basic stock price or single metric lookup
- fundamentals: Financial ratios, revenue, earnings analysis
- comparison: Comparing multiple companies
- analysis: Deep analysis requiring synthesis
- explanation: Explaining financial concepts
- general: General questions not requiring real-time data

Complexity:
- low: Single lookup or simple question
- medium: Multiple data points or moderate analysis
- high: Complex multi-step analysis or comparison

Extract ticker symbols from the query (e.g., AAPL, GOOGL, TSLA).

Respond ONLY with valid JSON in this format:
{
  "type": "query_type",
  "tickers": ["TICKER1", "TICKER2"],
  "requiresData": true,
  "complexity": "low"
}

User query: `

export async function classifyQuery(query: string): Promise<ClassificationResult> {
  const config = getModel('fast')

  try {
    const result = await generateText({
      model: config.model,
      maxOutputTokens: 256,
      temperature: 0.1,
      prompt: CLASSIFICATION_PROMPT + query,
    })

    const json = result.text.trim()
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = json.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult
    return {
      type: parsed.type || 'general',
      tickers: Array.isArray(parsed.tickers) ? parsed.tickers : [],
      requiresData: parsed.requiresData ?? false,
      complexity: parsed.complexity || 'medium',
    }
  } catch (error) {
    console.error('Classification error:', error)
    // Default to general query with medium complexity
    return {
      type: 'general',
      tickers: [],
      requiresData: false,
      complexity: 'medium',
    }
  }
}

export function getModelForQuery(classification: ClassificationResult) {
  // Use fast model for simple queries, balanced for complex
  if (classification.complexity === 'low' && !classification.requiresData) {
    return getModel('fast')
  }
  return getModel('balanced')
}
