/**
 * Middleware Constants
 * 
 * Express middleware'leri için genel sabit değerler.
 * Sadece mevcut projede kullanılan ve değişebilecek sabitler.
 * 
 */

// ==================== ERROR HANDLER CONSTANTS ====================

/**
 * Error Handler Messages
 * Error handler middleware için standart mesajlar
 */
export const ERROR_HANDLER_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  UNKNOWN_ERROR: 'Bilinmeyen hata oluştu',
} as const;

/**
 * Error Types
 * Hata türleri kategorileri
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  DATABASE: 'database',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  INTERNAL: 'internal',
  EXTERNAL: 'external',
} as const;

// ==================== LOGGING CONSTANTS ====================

/**
 * Request Logging Configuration
 * Request logging middleware için yapılandırma
 */
export const REQUEST_LOGGING_CONFIG = {
  EXCLUDE_PATHS: ['/health', '/favicon.ico', '/robots.txt'],
  SENSITIVE_HEADERS: ['authorization', 'cookie', 'x-api-key'],
  MAX_BODY_SIZE: 1024, // bytes
  TRUNCATE_MARKER: '... [truncated]',
} as const;

// ==================== CORS CONSTANTS ====================

/**
 * CORS Configuration
 * CORS middleware için yapılandırma sabitleri
 */
export const CORS_CONFIG = {
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
  ],
  EXPOSED_HEADERS: ['X-Total-Count', 'X-Page-Count'],
  MAX_AGE: 86400, // 24 hours
} as const;

// ==================== RATE LIMITING CONSTANTS ====================

/**
 * Rate Limiting Configuration
 * Rate limiting middleware için yapılandırma
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // requests per window
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false,
  HEADERS: {
    LIMIT: 'X-RateLimit-Limit',
    REMAINING: 'X-RateLimit-Remaining',
    RESET: 'X-RateLimit-Reset',
  },
} as const;

// ==================== SECURITY CONSTANTS ====================

/**
 * Security Headers Configuration
 * Security middleware için header yapılandırması
 */
export const SECURITY_HEADERS = {
  CONTENT_SECURITY_POLICY: "default-src 'self'",
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
  PERMISSIONS_POLICY: 'geolocation=(), microphone=(), camera=()',
} as const; 