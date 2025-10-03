/**
 * Suppress non-critical console warnings and errors
 * This is particularly useful for filtering out Vercel Live origin mismatch warnings
 * and other third-party SDK warnings that don't affect functionality
 */

export function suppressNonCriticalWarnings() {
  if (typeof window === 'undefined') return

  // Patterns to suppress
  const suppressPatterns = [
    /origins don't match.*vercel\.live/i,
    /vercel\.live.*origins/i,
    /Plugin Closed/i,
    /user rejected the request/i,
  ]

  // Store original console methods
  const originalError = console.error
  const originalWarn = console.warn

  // Override console.error
  console.error = (...args: unknown[]) => {
    const message = String(args[0])
    const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message))
    
    if (!shouldSuppress) {
      originalError.apply(console, args)
    }
  }

  // Override console.warn
  console.warn = (...args: unknown[]) => {
    const message = String(args[0])
    const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message))
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args)
    }
  }

  // Log that suppression is active (in development only)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.log('[Suppress] Non-critical warning suppression active')
  }
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  suppressNonCriticalWarnings()
}
