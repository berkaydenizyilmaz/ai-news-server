/**
 * Authentication Constants
 * 
 * Authentication ve authorization middleware'leri için sabit değerler.
 * Hata mesajları ve auth ile ilgili sabitler.
 * 
 */

// ==================== AUTH ERROR MESSAGES ====================

/**
 * Authentication Error Messages
 * Auth middleware'de kullanılan hata mesajları
 */
export const AUTH_ERROR_MESSAGES = {
  TOKEN_NOT_FOUND: 'Token bulunamadı',
  INVALID_TOKEN: 'Geçersiz token',
  TOKEN_VERIFICATION_FAILED: 'Token doğrulama hatası',
  AUTHENTICATION_REQUIRED: 'Kimlik doğrulama gerekli',
  INSUFFICIENT_PERMISSIONS: 'Bu işlem için yetkiniz yok',
  ACCESS_DENIED: 'Erişim reddedildi',
  SESSION_EXPIRED: 'Oturum süresi doldu',
  UNAUTHORIZED_ACCESS: 'Yetkisiz erişim',
} as const;

// ==================== AUTH SUCCESS MESSAGES ====================

/**
 * Authentication Success Messages
 * Auth işlemleri için başarı mesajları
 */
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Giriş başarılı',
  LOGOUT_SUCCESS: 'Çıkış başarılı',
  TOKEN_REFRESHED: 'Token yenilendi',
  ACCESS_GRANTED: 'Erişim izni verildi',
} as const;

// ==================== TOKEN CONFIGURATION ====================

/**
 * Token Configuration
 * JWT token yapılandırma sabitleri
 */
export const TOKEN_CONFIG = {
  BEARER_PREFIX: 'Bearer ',
  BEARER_PREFIX_LENGTH: 7, // "Bearer " uzunluğu
  HEADER_NAME: 'authorization',
} as const; 