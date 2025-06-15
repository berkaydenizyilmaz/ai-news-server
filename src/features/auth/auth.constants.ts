/**
 * Authentication Feature Constants
 * 
 * Auth modülü için özel sabit değerleri içerir.
 * Genel sabitler core constants'tan import edilir.
 * 
 */

import { 
  PASSWORD_CONSTRAINTS,
  USERNAME_CONSTRAINTS,
  EMAIL_CONSTRAINTS,
  PASSWORD_SECURITY,
  JWT_CONFIG,
  AUTH_ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES,
  USER_ROLES
} from '@/core/constants';

// ==================== IMPORTED CONSTANTS ====================

// Validation constraints - core constants'tan import edildi
export { PASSWORD_CONSTRAINTS, USERNAME_CONSTRAINTS, EMAIL_CONSTRAINTS };

// Security constants - core constants'tan import edildi
export { PASSWORD_SECURITY };

// JWT constants - core constants'tan import edildi
export const JWT_CONSTANTS = JWT_CONFIG;

// Auth messages - core constants'tan import edildi
export { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES };

// ==================== MODULE SPECIFIC CONSTANTS ====================

/**
 * Default User Role
 * Yeni kullanıcılar için varsayılan rol
 */
export const DEFAULT_USER_ROLE = USER_ROLES.USER;

/**
 * User Status Constants
 * Kullanıcı durumu sabitleri
 */
export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

/**
 * Validation Error Messages
 * Auth modülü için özel form validasyon hata mesajları
 */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email adresi zorunludur',
  EMAIL_INVALID: 'Geçerli bir email adresi giriniz',
  PASSWORD_REQUIRED: 'Şifre zorunludur',
  PASSWORD_MIN_LENGTH: `Şifre en az ${PASSWORD_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  PASSWORD_MAX_LENGTH: `Şifre en fazla ${PASSWORD_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  USERNAME_REQUIRED: 'Kullanıcı adı zorunludur',
  USERNAME_MIN_LENGTH: `Kullanıcı adı en az ${USERNAME_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  USERNAME_MAX_LENGTH: `Kullanıcı adı en fazla ${USERNAME_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  USERNAME_INVALID_CHARS: 'Kullanıcı adı sadece harf ve rakam içerebilir',
  CURRENT_PASSWORD_REQUIRED: 'Mevcut şifre zorunludur',
  NEW_PASSWORD_REQUIRED: 'Yeni şifre zorunludur',
  RESET_TOKEN_REQUIRED: 'Reset token zorunludur',
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
} as const; 