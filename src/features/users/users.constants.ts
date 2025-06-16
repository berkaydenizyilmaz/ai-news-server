/**
 * Users Feature Constants
 * 
 * Users modülü için özel sabit değerleri içerir.
 * Genel sabitler core constants'tan import edilir.
 * 
 */

import { 
  USER_ROLES,
  USER_STATUS,
  PAGINATION_DEFAULTS,
  AUTH_ERROR_MESSAGES,
  HTTP_STATUS
} from '@/core/constants';

// ==================== IMPORTED CONSTANTS ====================

// User roles and status - core constants'tan import edildi
export { USER_ROLES, USER_STATUS };

// Pagination defaults - core constants'tan import edildi
export { PAGINATION_DEFAULTS };

// ==================== MODULE SPECIFIC CONSTANTS ====================

/**
 * Users Query Constraints
 * Kullanıcı listesi sorguları için kısıtlamalar
 */
export const USERS_QUERY_CONSTRAINTS = {
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_LIMIT: PAGINATION_DEFAULTS.LIMIT,
  DEFAULT_OFFSET: PAGINATION_DEFAULTS.PAGE,
} as const;

/**
 * Users Search Constraints
 * Kullanıcı arama için kısıtlamalar
 */
export const USERS_SEARCH_CONSTRAINTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 50,
} as const;

/**
 * Users Sort Options
 * Kullanıcı listesi sıralama seçenekleri
 */
export const USERS_SORT_OPTIONS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  EMAIL: 'email',
  USERNAME: 'username',
  ROLE: 'role',
} as const;

/**
 * Users Sort Directions
 * Sıralama yönleri
 */
export const USERS_SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// ==================== ERROR MESSAGES ====================

/**
 * Users Error Messages
 * Users modülü için özel hata mesajları
 */
export const USERS_ERROR_MESSAGES = {
  USER_NOT_FOUND: AUTH_ERROR_MESSAGES.USER_NOT_FOUND,
  EMAIL_EXISTS: AUTH_ERROR_MESSAGES.EMAIL_EXISTS,
  USERNAME_EXISTS: AUTH_ERROR_MESSAGES.USERNAME_EXISTS,
  INVALID_USER_ID: 'Geçersiz kullanıcı ID\'si',
  INVALID_ROLE: 'Geçersiz kullanıcı rolü',
  INVALID_STATUS: 'Geçersiz kullanıcı durumu',
  CANNOT_DELETE_SELF: 'Kendi hesabınızı silemezsiniz',
  CANNOT_MODIFY_ADMIN: 'Admin kullanıcıları değiştirilemez',
  INSUFFICIENT_PERMISSIONS: 'Bu işlem için yetkiniz yok',
  USER_UPDATE_FAILED: 'Kullanıcı güncelleme işlemi başarısız oldu',
  USER_DELETE_FAILED: 'Kullanıcı silme işlemi başarısız oldu',
  USERS_FETCH_FAILED: 'Kullanıcı listesi alınamadı',
} as const;

/**
 * Users Success Messages
 * Users modülü için başarı mesajları
 */
export const USERS_SUCCESS_MESSAGES = {
  USER_UPDATED: 'Kullanıcı başarıyla güncellendi',
  USER_DELETED: 'Kullanıcı başarıyla silindi',
  USER_ROLE_UPDATED: 'Kullanıcı rolü başarıyla güncellendi',
  USER_STATUS_UPDATED: 'Kullanıcı durumu başarıyla güncellendi',
  USERS_FETCHED: 'Kullanıcı listesi başarıyla alındı',
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

/**
 * Users Validation Error Messages
 * Users modülü için form validasyon hata mesajları
 */
export const USERS_VALIDATION_MESSAGES = {
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
  USER_ID_REQUIRED: 'Kullanıcı ID\'si zorunludur',
  USER_ID_INVALID: 'Geçersiz kullanıcı ID formatı',
  ROLE_REQUIRED: 'Kullanıcı rolü zorunludur',
  ROLE_INVALID: 'Geçersiz kullanıcı rolü',
  STATUS_REQUIRED: 'Kullanıcı durumu zorunludur',
  STATUS_INVALID: 'Geçersiz kullanıcı durumu',
  LIMIT_INVALID: `Limit ${USERS_QUERY_CONSTRAINTS.MIN_LIMIT}-${USERS_QUERY_CONSTRAINTS.MAX_LIMIT} arasında olmalıdır`,
  OFFSET_INVALID: 'Offset 0 veya pozitif bir sayı olmalıdır',
  SEARCH_TOO_SHORT: `Arama terimi en az ${USERS_SEARCH_CONSTRAINTS.MIN_SEARCH_LENGTH} karakter olmalıdır`,
  SEARCH_TOO_LONG: `Arama terimi en fazla ${USERS_SEARCH_CONSTRAINTS.MAX_SEARCH_LENGTH} karakter olmalıdır`,
  SORT_INVALID: 'Geçersiz sıralama seçeneği',
  SORT_DIRECTION_INVALID: 'Geçersiz sıralama yönü',
} as const; 