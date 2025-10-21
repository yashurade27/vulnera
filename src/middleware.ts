import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (for development)
// For production, use Redis-based solution like Upstash
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimit(identifier: string): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up old entries
  if (record && record.resetTime < now) {
    rateLimitStore.delete(identifier);
  }

  const current = rateLimitStore.get(identifier);

  if (!current) {
    // First request
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_WINDOW,
    });
    return {
      success: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: now + RATE_WINDOW,
    };
  }

  if (current.count >= RATE_LIMIT) {
    // Rate limit exceeded
    return {
      success: false,
      limit: RATE_LIMIT,
      remaining: 0,
      reset: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  return {
    success: true,
    limit: RATE_LIMIT,
    remaining: RATE_LIMIT - current.count,
    reset: current.resetTime,
  };
}

export async function middleware(request: NextRequest) {
  // Skip rate limiting for static files and internal routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.') || // Skip files with extensions
    !request.nextUrl.pathname.startsWith('/api') // Only rate limit API routes
  ) {
    return NextResponse.next();
  }

  // Get client identifier (IP address)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
    request.headers.get('x-real-ip') ?? 
    '127.0.0.1';

  // Check rate limit
  const { success, limit, reset, remaining } = rateLimit(ip);

  // Create response
  const response = success 
    ? NextResponse.next() 
    : NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        { status: 429 }
      );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  if (!success) {
    response.headers.set('Retry-After', Math.ceil((reset - Date.now()) / 1000).toString());
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
