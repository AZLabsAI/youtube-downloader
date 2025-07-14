import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

export function middleware(request: NextRequest) {
  // Only apply rate limiting to download endpoints
  if (!request.nextUrl.pathname.startsWith('/api/download')) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';

  const now = Date.now();
  const userRateLimit = rateLimitMap.get(ip);

  if (!userRateLimit || now > userRateLimit.resetTime) {
    // Create new rate limit window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return NextResponse.next();
  }

  if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please wait before making another request.',
        retryAfter: Math.ceil((userRateLimit.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((userRateLimit.resetTime - now) / 1000).toString()
        }
      }
    );
  }

  // Increment request count
  userRateLimit.count++;
  
  return NextResponse.next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

export const config = {
  matcher: '/api/:path*',
};