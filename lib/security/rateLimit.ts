interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimitService {
  private attempts: Map<string, RateLimitRecord> = new Map();

  checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return { allowed: true, remainingAttempts: 4 }; // 5-1 = 4 remaining
    }

    // Check if blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        resetTime: record.blockedUntil 
      };
    }

    // Reset if window expired (15 minutes)
    if (now - record.firstAttempt > 15 * 60 * 1000) {
      this.attempts.set(identifier, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return { allowed: true, remainingAttempts: 4 };
    }

    // Check attempts
    if (record.attempts >= 5) {
      const blockedUntil = now + (30 * 60 * 1000); // 30 minutes
      record.blockedUntil = blockedUntil;
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        resetTime: blockedUntil 
      };
    }

    // Increment attempts
    record.attempts++;
    record.lastAttempt = now;
    this.attempts.set(identifier, record);

    return { 
      allowed: true, 
      remainingAttempts: 5 - record.attempts 
    };
  }

  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [identifier, record] of this.attempts.entries()) {
      if (now - record.lastAttempt > 30 * 60 * 1000) { // 30 minutes
        this.attempts.delete(identifier);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();

// Clean up every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitService.cleanupExpired();
  }, 60 * 60 * 1000);
}