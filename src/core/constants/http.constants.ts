/**
 * HTTP Constants
 * 
 * HTTP durum kodları ve HTTP ile ilgili sabit değerler.
 * RESTful API endpoint'lerinde kullanılır.
 * 
 */

// ==================== HTTP STATUS CODES ====================

/**
 * HTTP Status Codes
 * Standart HTTP durum kodları
 */
export const HTTP_STATUS = {
  // Success Responses (2xx)
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Error Responses (4xx)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Error Responses (5xx)
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ==================== HTTP METHODS ====================

/**
 * HTTP Methods
 * RESTful API'lerde kullanılan HTTP metodları
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

// ==================== CONTENT TYPES ====================

/**
 * Content Types
 * HTTP header'larında kullanılan content type değerleri
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  PLAIN: 'text/plain',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM: 'multipart/form-data',
  RSS_XML: 'application/rss+xml',
} as const; 