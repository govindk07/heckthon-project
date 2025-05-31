// Simple in-memory rate limiter for API routes
// In production, consider using Redis or a database for persistence

interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export function rateLimit(
  ip: string,
  options: RateLimitOptions
): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const { windowMs, maxRequests } = options;

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to cleanup
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, data] of entries) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  let rateLimitData = rateLimitStore.get(ip);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // Create new or reset expired rate limit data
    rateLimitData = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(ip, rateLimitData);

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: rateLimitData.resetTime,
    };
  }

  rateLimitData.count++;

  if (rateLimitData.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: rateLimitData.resetTime,
    };
  }

  return {
    success: true,
    remaining: maxRequests - rateLimitData.count,
    resetTime: rateLimitData.resetTime,
  };
}

export function getClientIP(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback to a default (not ideal but prevents errors)
  return "unknown";
}
