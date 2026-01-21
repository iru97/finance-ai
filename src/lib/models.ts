import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Initialize providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

// Model configuration
// Gemini 2.0 Flash: $0.10/$0.40 per 1M tokens (fast, cheap)
// GPT-4.1: $2.00/$8.00 per 1M tokens (quality synthesis)
export const MODEL_CONFIG = {
  // Fast model for classification, simple tasks
  fast: {
    model: google('gemini-2.0-flash'),
    maxTokens: 1024,
    temperature: 0.1,
  },
  // Balanced model for synthesis and complex reasoning
  balanced: {
    model: openai('gpt-4.1'),
    maxTokens: 4096,
    temperature: 0.3,
  },
} as const

export type ModelType = keyof typeof MODEL_CONFIG

export function getModel(type: ModelType) {
  return MODEL_CONFIG[type]
}
