/**
 * Input sanitization utilities for security
 */

// Maximum allowed query length
const MAX_QUERY_LENGTH = 1000

// Patterns that might indicate prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/i,
  /disregard\s+(previous|all|above)\s+instructions/i,
  /forget\s+(everything|all|previous)/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?:/i,
  /system\s*:\s*$/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /human\s*:\s*$/i,
  /assistant\s*:\s*$/i,
]

// Content that might indicate harmful financial advice requests
const HARMFUL_PATTERNS = [
  /guaranteed\s+(returns|profit|money)/i,
  /insider\s+(trading|information|tip)/i,
  /pump\s+and\s+dump/i,
  /money\s+laundering/i,
  /tax\s+evasion/i,
  /market\s+manipulation/i,
]

interface SanitizeResult {
  sanitized: string
  isValid: boolean
  issues: string[]
}

/**
 * Sanitize user input to prevent prompt injection and harmful requests
 */
export function sanitizeInput(input: string): SanitizeResult {
  const issues: string[] = []
  let sanitized = input.trim()

  // Check length
  if (sanitized.length > MAX_QUERY_LENGTH) {
    sanitized = sanitized.substring(0, MAX_QUERY_LENGTH)
    issues.push(`Query truncated to ${MAX_QUERY_LENGTH} characters`)
  }

  // Check for empty input
  if (sanitized.length === 0) {
    return {
      sanitized: '',
      isValid: false,
      issues: ['Query cannot be empty'],
    }
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      issues.push('Potential prompt injection detected')
      // Remove the problematic pattern
      sanitized = sanitized.replace(pattern, '')
    }
  }

  // Check for harmful financial content
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(sanitized)) {
      issues.push('Request may involve harmful financial activities')
    }
  }

  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    .replace(/\\x[0-9A-Fa-f]{2}/g, '') // Hex escape sequences
    .replace(/\\u[0-9A-Fa-f]{4}/g, '') // Unicode escape sequences

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ')

  const isValid = issues.filter(i =>
    i.includes('injection') ||
    i.includes('harmful')
  ).length === 0

  return {
    sanitized,
    isValid,
    issues,
  }
}

/**
 * Validate ticker symbol format
 */
export function validateTicker(ticker: string): boolean {
  // US stock tickers are 1-5 uppercase letters
  const tickerRegex = /^[A-Z]{1,5}$/
  return tickerRegex.test(ticker.toUpperCase())
}

/**
 * Sanitize and validate multiple tickers
 */
export function sanitizeTickers(tickers: string[]): string[] {
  return tickers
    .map(t => t.trim().toUpperCase())
    .filter(t => validateTicker(t))
    .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
}

/**
 * Extract potential ticker symbols from text
 */
export function extractTickers(text: string): string[] {
  // Common patterns for mentioning stocks
  const patterns = [
    /\$([A-Z]{1,5})\b/g, // $AAPL format
    /\b([A-Z]{1,5})\s+(stock|shares?|ticker)/gi, // AAPL stock
  ]

  const tickers: string[] = []

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const ticker = match[1].toUpperCase()
      if (validateTicker(ticker)) {
        tickers.push(ticker)
      }
    }
  }

  return [...new Set(tickers)]
}
