// Simple client-side rate limiter for contact form
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 3, windowMs: number = 60000) { // 3 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window has reset
      this.storage.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    this.storage.set(identifier, entry);
    return true;
  }

  getRemainingTime(identifier: string): number {
    const entry = this.storage.get(identifier);
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.storage.get(identifier);
    if (!entry) return this.maxRequests;
    
    const now = Date.now();
    if (now > entry.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - entry.count);
  }
}

// Export singleton instance
export const contactFormLimiter = new RateLimiter(3, 60000); // 3 requests per minute

// Helper function to get client identifier
export function getClientIdentifier(): string {
  if (typeof window === 'undefined') return 'server';
  
  // Use a combination of factors for identification
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a simple hash (not cryptographically secure, just for rate limiting)
  const identifier = `${userAgent}-${language}-${timezone}`;
  return btoa(identifier).slice(0, 16);
}