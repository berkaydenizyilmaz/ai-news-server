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
 * Auth middleware ve service'lerde kullanılan hata mesajları
 */
export const AUTH_ERROR_MESSAGES = {
  // Middleware errors
  TOKEN_NOT_FOUND: 'Token bulunamadı',
  INVALID_TOKEN: 'Geçersiz token',
  TOKEN_VERIFICATION_FAILED: 'Token doğrulama hatası',
  AUTHENTICATION_REQUIRED: 'Kimlik doğrulama gerekli',
  INSUFFICIENT_PERMISSIONS: 'Bu işlem için yetkiniz yok',
  ACCESS_DENIED: 'Erişim reddedildi',
  SESSION_EXPIRED: 'Oturum süresi doldu',
  UNAUTHORIZED_ACCESS: 'Yetkisiz erişim',
  
  // Service errors
  EMAIL_EXISTS: 'Bu email adresi zaten kullanılıyor',
  USERNAME_EXISTS: 'Bu kullanıcı adı zaten kullanılıyor',
  INVALID_CREDENTIALS: 'Email veya şifre hatalı',
  USER_NOT_FOUND: 'Kullanıcı bulunamadı',
  INVALID_CURRENT_PASSWORD: 'Mevcut şifre hatalı',
  USER_CREATION_FAILED: 'Kullanıcı oluşturulamadı',
  PASSWORD_UPDATE_FAILED: 'Şifre güncellenemedi',
  UNAUTHORIZED: 'Yetkilendirme gerekli',
} as const;

// ==================== AUTH SUCCESS MESSAGES ====================

/**
 * Authentication Success Messages
 * Auth işlemleri için başarı mesajları
 */
export const AUTH_SUCCESS_MESSAGES = {
  // General success messages
  LOGIN_SUCCESS: 'Giriş başarılı',
  LOGOUT_SUCCESS: 'Çıkış başarılı',
  TOKEN_REFRESHED: 'Token yenilendi',
  ACCESS_GRANTED: 'Erişim izni verildi',
  
  // Service success messages
  USER_CREATED: 'Kullanıcı başarıyla oluşturuldu',
  PASSWORD_CHANGED: 'Şifre başarıyla güncellendi',
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