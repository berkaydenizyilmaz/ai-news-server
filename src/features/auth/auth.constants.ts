/**
 * Authentication Feature Constants
 * 
 * Auth modülü için tüm sabit değerleri içerir.
 * Validation, security ve business logic sabitleri.
 * 
 */

// ==================== VALIDATION CONSTANTS ====================

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

// ==================== SECURITY CONSTANTS ====================

/**
 * Password Hashing Constants
 * Bcrypt şifre hash'leme için güvenlik sabitleri
 */
export const PASSWORD_SECURITY = {
  SALT_ROUNDS: 12, // Yüksek güvenlik için 12 rounds
} as const;

/**
 * JWT Token Constants
 * JWT token yönetimi için sabitler
 */
export const JWT_CONSTANTS = {
  DEFAULT_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256',
} as const;

// ==================== USER ROLE CONSTANTS ====================

import { USER_ROLES } from '@/core/constants';

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

// ==================== ERROR MESSAGES ====================

/**
 * Authentication Error Messages
 * Standart hata mesajları
 */
export const AUTH_ERROR_MESSAGES = {
  EMAIL_EXISTS: 'Bu email adresi zaten kullanılıyor',
  USERNAME_EXISTS: 'Bu kullanıcı adı zaten kullanılıyor',
  INVALID_CREDENTIALS: 'Email veya şifre hatalı',
  USER_NOT_FOUND: 'Kullanıcı bulunamadı',
  INVALID_CURRENT_PASSWORD: 'Mevcut şifre hatalı',
  USER_CREATION_FAILED: 'Kullanıcı oluşturulamadı',
  PASSWORD_UPDATE_FAILED: 'Şifre güncellenemedi',
  UNAUTHORIZED: 'Yetkilendirme gerekli',
} as const;

/**
 * Authentication Success Messages
 * Standart başarı mesajları
 */
export const AUTH_SUCCESS_MESSAGES = {
  USER_CREATED: 'Kullanıcı başarıyla oluşturuldu',
  LOGIN_SUCCESS: 'Giriş başarılı',
  PASSWORD_CHANGED: 'Şifre başarıyla güncellendi',
  LOGOUT_SUCCESS: 'Çıkış başarılı',
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

/**
 * Validation Error Messages
 * Form validasyon hata mesajları
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