/**
 * Validation Constants
 * 
 * Genel validation kuralları ve regex pattern'leri.
 * Tüm modüllerde ortak kullanılan validation sabitleri.
 * 
 */

// ==================== COMMON VALIDATION PATTERNS ====================

/**
 * Common Regex Patterns
 * Sık kullanılan regex pattern'leri
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_UNDERSCORE: /^[a-zA-Z0-9_]+$/,
  ALPHANUMERIC_DASH: /^[a-zA-Z0-9-]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
} as const;

// ==================== STRING LENGTH CONSTRAINTS ====================

/**
 * Common String Length Constraints
 * Genel string uzunluk sınırları
 */
export const STRING_CONSTRAINTS = {
  // Short strings
  SHORT_MIN: 2,
  SHORT_MAX: 50,
  
  // Medium strings
  MEDIUM_MIN: 3,
  MEDIUM_MAX: 255,
  
  // Long strings
  LONG_MIN: 10,
  LONG_MAX: 1000,
  
  // Very long strings
  VERY_LONG_MIN: 50,
  VERY_LONG_MAX: 5000,
  
  // Specific fields
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 500,
  
  CONTENT_MIN: 50,
  CONTENT_MAX: 10000,
  
  NAME_MIN: 2,
  NAME_MAX: 100,
  
  SLUG_MIN: 3,
  SLUG_MAX: 100,
} as const;

// ==================== AUTH VALIDATION CONSTRAINTS ====================

/**
 * Password Validation Constants
 * Şifre doğrulama için minimum/maksimum değerler
 */
export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 30,
} as const;

/**
 * Username Validation Constants
 * Kullanıcı adı doğrulama için minimum/maksimum değerler
 */
export const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  REGEX: /^[a-zA-Z0-9]+$/,
} as const;

/**
 * Email Validation Constants
 * Email doğrulama için sabitler
 */
export const EMAIL_CONSTRAINTS = {
  MAX_LENGTH: 255,
} as const;

// ==================== NUMERIC CONSTRAINTS ====================

/**
 * Numeric Constraints
 * Sayısal değer sınırları
 */
export const NUMERIC_CONSTRAINTS = {
  // Age constraints
  AGE_MIN: 13,
  AGE_MAX: 120,
  
  // Rating constraints
  RATING_MIN: 1,
  RATING_MAX: 5,
  
  // Priority constraints
  PRIORITY_MIN: 1,
  PRIORITY_MAX: 10,
  
  // Percentage constraints
  PERCENTAGE_MIN: 0,
  PERCENTAGE_MAX: 100,
  
  // Count constraints
  COUNT_MIN: 0,
  COUNT_MAX: 1000000,
} as const;

// ==================== FILE VALIDATION ====================

/**
 * File Validation Constraints
 * Dosya doğrulama sınırları
 */
export const FILE_CONSTRAINTS = {
  // Image files
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE_MAX_WIDTH: 2048,
  IMAGE_MAX_HEIGHT: 2048,
  
  // Document files
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // General file constraints
  FILENAME_MIN: 1,
  FILENAME_MAX: 255,
  MAX_FILES_PER_UPLOAD: 10,
} as const;

// ==================== DATE VALIDATION ====================

/**
 * Date Validation Constraints
 * Tarih doğrulama sınırları
 */
export const DATE_CONSTRAINTS = {
  // Date ranges
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  
  // Age calculations
  MIN_BIRTH_YEAR: 1900,
  MAX_BIRTH_YEAR: new Date().getFullYear() - 13, // Minimum 13 yaş
  
  // Future date limits
  MAX_FUTURE_DAYS: 365, // 1 yıl ileri
  
  // Past date limits
  MAX_PAST_DAYS: 36500, // 100 yıl geri
} as const;

// ==================== COMMON ERROR MESSAGES ====================

/**
 * Common Validation Error Messages
 * Genel validation hata mesajları
 */
export const VALIDATION_ERROR_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  INVALID_FORMAT: 'Geçersiz format',
  TOO_SHORT: 'Çok kısa',
  TOO_LONG: 'Çok uzun',
  INVALID_EMAIL: 'Geçerli bir e-posta adresi giriniz',
  INVALID_URL: 'Geçerli bir URL giriniz',
  INVALID_UUID: 'Geçerli bir UUID giriniz',
  INVALID_PHONE: 'Geçerli bir telefon numarası giriniz',
  INVALID_DATE: 'Geçerli bir tarih giriniz',
  FUTURE_DATE_NOT_ALLOWED: 'Gelecek tarih giremezsiniz',
  PAST_DATE_NOT_ALLOWED: 'Geçmiş tarih giremezsiniz',
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük',
  INVALID_FILE_TYPE: 'Geçersiz dosya tipi',
  TOO_MANY_FILES: 'Çok fazla dosya',
  NUMERIC_ONLY: 'Sadece sayı girebilirsiniz',
  ALPHANUMERIC_ONLY: 'Sadece harf ve rakam girebilirsiniz',
  MIN_VALUE: 'Minimum değer',
  MAX_VALUE: 'Maksimum değer',
} as const; 