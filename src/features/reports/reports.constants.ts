/**
 * Reports Feature Constants
 * 
 * Reports modülü için tüm sabit değerleri içerir.
 * Validation, business logic ve message sabitleri.
 * 
 */

// ==================== VALIDATION CONSTANTS ====================

/**
 * Report Reason Constraints
 * Şikayet nedeni için minimum/maksimum değerler
 */
export const REPORT_REASON_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 255,
} as const;

/**
 * Report Description Constraints
 * Şikayet açıklaması için maksimum değer
 */
export const REPORT_DESCRIPTION_CONSTRAINTS = {
  MAX_LENGTH: 1000,
} as const;

/**
 * Report Query Constraints
 * Report sorgu parametreleri için sınırlar
 */
export const REPORT_QUERY_CONSTRAINTS = {
  PAGE_MIN: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
} as const;

/**
 * Report Types
 * Şikayet edilebilir içerik türleri
 */
export const REPORT_TYPES = {
  NEWS: 'news',
  COMMENT: 'comment',
  FORUM_POST: 'forum_post',
  FORUM_TOPIC: 'forum_topic',
} as const;

/**
 * Report Status Types
 * Şikayet durumları
 */
export const REPORT_STATUS_TYPES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

/**
 * Report Permissions
 * Şikayet yönetimi yetkileri
 */
export const REPORT_PERMISSIONS = {
  CREATE: ['user', 'moderator', 'admin'],
  VIEW_ALL: ['moderator', 'admin'],
  REVIEW: ['moderator', 'admin'],
  RESOLVE: ['moderator', 'admin'],
  DISMISS: ['moderator', 'admin'],
};

// ==================== ERROR MESSAGES ====================

/**
 * Reports Error Messages
 * Reports işlemleri için hata mesajları
 */
export const REPORT_ERROR_MESSAGES = {
  // Report Management Errors
  REPORT_NOT_FOUND: 'Şikayet bulunamadı',
  REPORT_CREATE_FAILED: 'Şikayet oluşturulamadı',
  REPORT_UPDATE_FAILED: 'Şikayet güncellenemedi',
  REPORT_DELETE_FAILED: 'Şikayet silinemedi',
  REPORT_FETCH_FAILED: 'Şikayetler getirilemedi',
  REPORT_REVIEW_FAILED: 'Şikayet değerlendirilemedi',
  
  // Content Validation Errors
  CONTENT_NOT_FOUND: 'Şikayet edilen içerik bulunamadı',
  CONTENT_TYPE_INVALID: 'Geçersiz içerik türü',
  DUPLICATE_REPORT: 'Bu içerik için zaten şikayet gönderilmiş',
  SELF_REPORT_NOT_ALLOWED: 'Kendi içeriğinizi şikayet edemezsiniz',
  
  // Permission Errors
  UNAUTHORIZED: 'Yetkilendirme gerekli',
  INSUFFICIENT_PERMISSIONS: 'Bu işlem için yetkiniz yok',
  REVIEW_PERMISSION_REQUIRED: 'Şikayet değerlendirmesi için moderatör yetkisi gerekli',
  
  // General Errors
  OPERATION_FAILED: 'İşlem sırasında bir hata oluştu',
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
  INVALID_QUERY_PARAMS: 'Geçersiz sorgu parametreleri',
  INVALID_REPORT_ID: 'Geçerli bir şikayet ID giriniz',
  INVALID_STATUS: 'Geçersiz şikayet durumu',
} as const;

// ==================== SUCCESS MESSAGES ====================

/**
 * Reports Success Messages
 * Reports işlemleri için başarı mesajları
 */
export const REPORT_SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Şikayet başarıyla gönderildi',
  REPORT_REVIEWED: 'Şikayet başarıyla değerlendirildi',
  REPORT_RESOLVED: 'Şikayet başarıyla çözüldü',
  REPORT_DISMISSED: 'Şikayet başarıyla reddedildi',
  BULK_ACTION_COMPLETED: 'Toplu işlem başarıyla tamamlandı',
} as const;

// ==================== VALIDATION MESSAGES ====================

/**
 * Reports Validation Messages
 * Reports doğrulama için mesajlar
 */
export const REPORT_VALIDATION_MESSAGES = {
  // Reason Validation
  REASON_REQUIRED: 'Şikayet nedeni zorunludur',
  REASON_MIN_LENGTH: `Şikayet nedeni en az ${REPORT_REASON_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  REASON_MAX_LENGTH: `Şikayet nedeni en fazla ${REPORT_REASON_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  
  // Description Validation
  DESCRIPTION_MAX_LENGTH: `Açıklama en fazla ${REPORT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  
  // Type Validation
  REPORTED_TYPE_REQUIRED: 'Şikayet türü zorunludur',
  REPORTED_TYPE_INVALID: 'Geçersiz şikayet türü',
  REPORTED_ID_REQUIRED: 'Şikayet edilen içerik ID\'si zorunludur',
  REPORTED_ID_INVALID: 'Geçerli bir içerik ID giriniz',
  
  // Status Validation
  STATUS_INVALID: 'Geçersiz şikayet durumu',
  
  // Query Validation
  PAGE_INVALID: 'Sayfa numarası geçerli bir sayı olmalıdır',
  PAGE_MIN: `Sayfa numarası en az ${REPORT_QUERY_CONSTRAINTS.PAGE_MIN} olmalıdır`,
  LIMIT_INVALID: 'Limit geçerli bir sayı olmalıdır',
  LIMIT_RANGE: `Limit ${REPORT_QUERY_CONSTRAINTS.LIMIT_MIN}-${REPORT_QUERY_CONSTRAINTS.LIMIT_MAX} arasında olmalıdır`,
  SEARCH_MIN_LENGTH: `Arama terimi en az ${REPORT_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH} karakter olmalıdır`,
  SEARCH_MAX_LENGTH: `Arama terimi en fazla ${REPORT_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH} karakter olmalıdır`,
  
  // ID Validation
  REPORT_ID_INVALID: 'Geçerli bir şikayet ID giriniz',
  UUID_INVALID: 'Geçerli bir ID giriniz',
} as const; 