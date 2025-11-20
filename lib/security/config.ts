export const SECURITY_CONFIG = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
    BLOCK_COMMON_PASSWORDS: true,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },
  
  // Session security
  SESSION: {
    TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
    RENEWAL_THRESHOLD: 30 * 60 * 1000, // 30 minutes
  },
  
  // CSRF protection
  CSRF: {
    TOKEN_LENGTH: 32,
    MAX_AGE: 60 * 60 * 1000, // 1 hour
  }
};

// Common passwords to block
export const COMMON_PASSWORDS = [
  'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
  'welcome', 'monkey', '123456789', '12345678', '12345', '1234567'
];