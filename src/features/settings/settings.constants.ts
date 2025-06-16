/**
 * Settings Feature Constants
 * 
 * Settings modülü için özel sabit değerleri içerir.
 * Genel sabitler core constants'tan import edilir.
 * 
 */

import { SETTING_CATEGORIES } from '@/core/constants';

// ==================== IMPORTED CONSTANTS ====================

// Setting categories - core constants'tan import edildi (Zod enum için array formatına dönüştürülür)
export const SETTING_CATEGORIES_ARRAY = Object.values(SETTING_CATEGORIES) as [string, ...string[]];


// ==================== MODULE SPECIFIC CONSTANTS ====================

/**
 * Setting Key Constraints
 * Ayar anahtarı için minimum/maksimum değerler
 */
export const SETTING_KEY_CONSTRAINTS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
  REGEX: /^[a-zA-Z0-9_.-]+$/,
} as const;

/**
 * Setting Description Constraints
 * Ayar açıklaması için maksimum değer
 */
export const SETTING_DESCRIPTION_CONSTRAINTS = {
  MAX_LENGTH: 500,
} as const;

/**
 * Bulk Update Constraints
 * Toplu güncelleme için sınırlar
 */
export const BULK_UPDATE_CONSTRAINTS = {
  MIN_SETTINGS: 1,
} as const;

// ==================== SETTING TYPES ====================

/**
 * Valid Setting Types
 * Desteklenen ayar tipleri
 */
export const SETTING_TYPES = ['string', 'number', 'boolean', 'json'] as const;



// ==================== ERROR MESSAGES ====================

/**
 * Settings Error Messages
 * Standart hata mesajları
 */
export const SETTINGS_ERROR_MESSAGES = {
  KEY_EXISTS: 'Bu ayar anahtarı zaten kullanılıyor',
  INVALID_VALUE_TYPE: 'Ayar değeri belirtilen tip ile uyumlu değil',
  SETTING_CREATION_FAILED: 'Ayar oluşturulamadı',
  SETTING_NOT_FOUND: 'Ayar bulunamadı',
  SETTING_UPDATE_FAILED: 'Ayar güncellenemedi',
  SETTING_DELETE_FAILED: 'Ayar silinemedi',
  SETTINGS_FETCH_FAILED: 'Ayarlar getirilemedi',
  VALUE_CONVERSION_FAILED: 'Ayar değeri dönüştürülürken bir hata oluştu',
  BULK_UPDATE_FAILED: 'Toplu güncelleme sırasında bir hata oluştu',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmuyor',
} as const;

/**
 * Settings Success Messages
 * Standart başarı mesajları
 */
export const SETTINGS_SUCCESS_MESSAGES = {
  SETTING_CREATED: 'Ayar başarıyla oluşturuldu',
  SETTING_UPDATED: 'Ayar başarıyla güncellendi',
  SETTING_DELETED: 'Ayar başarıyla silindi',
  SETTINGS_FETCHED: 'Ayarlar başarıyla getirildi',
  BULK_UPDATE_SUCCESS: 'Ayarlar başarıyla güncellendi',
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

/**
 * Validation Error Messages
 * Form validasyon hata mesajları
 */
export const SETTINGS_VALIDATION_MESSAGES = {
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
  KEY_REQUIRED: 'Ayar anahtarı zorunludur',
  KEY_TOO_SHORT: `Ayar anahtarı en az ${SETTING_KEY_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  KEY_TOO_LONG: `Ayar anahtarı en fazla ${SETTING_KEY_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  KEY_INVALID_CHARS: 'Ayar anahtarı sadece harf, rakam, alt çizgi, nokta ve tire içerebilir',
  VALUE_REQUIRED: 'Ayar değeri zorunludur',
  INVALID_SETTING_TYPE: 'Geçerli bir ayar tipi seçiniz',
  INVALID_CATEGORY: 'Geçerli bir kategori seçiniz',
  DESCRIPTION_TOO_LONG: `Açıklama en fazla ${SETTING_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  MIN_SETTINGS_REQUIRED: 'En az bir ayar güncellenmeli',
} as const; 