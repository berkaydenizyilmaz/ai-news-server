/**
 * Core Constants
 * 
 * Bu dosya, uygulama için genel sabitleri içerir.
 * HTTP durum kodları, kullanıcı rollerinin sabit tanımları, ayar kategorileri ve log seviyeleri gibi sabit değerleri içerir.
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// User Roles
export const USER_ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

// Setting Categories
export const SETTING_CATEGORIES = {
  GENERAL: 'general',
  RSS: 'rss',
  AI: 'ai',
  AUTH: 'auth',
  NEWS: 'news',
  FORUM: 'forum',
} as const;

// Log Levels
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug',
} as const;