/**
 * Log Feature Constants
 * 
 * Log modülü için tüm sabit değerleri içerir.
 * Validation, business logic ve message sabitleri.
 * 
 */

// ==================== VALIDATION CONSTANTS ====================

/**
 * Log Message Constraints
 * Log mesajı için minimum/maksimum değerler
 */
export const MESSAGE_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 2000,
} as const;

/**
 * Module and Action Constraints
 * Modül ve aksiyon alanları için maksimum değerler
 */
export const MODULE_ACTION_CONSTRAINTS = {
  MODULE_MAX_LENGTH: 50,
  ACTION_MAX_LENGTH: 100,
} as const;

/**
 * Query Constraints
 * Sorgu parametreleri için sınırlar
 */
export const QUERY_CONSTRAINTS = {
  PAGE_MIN: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 50,
  SEARCH_MAX_LENGTH: 200,
  METADATA_MAX_SIZE: 1024 * 1024, // 1MB
} as const;

/**
 * Date Constraints
 * Tarih işlemleri için sınırlar
 */
export const DATE_CONSTRAINTS = {
  MIN_RETENTION_DAYS: 30,
  MAX_CLEANUP_DAYS: 3650, // 10 yıl
  DEFAULT_CLEANUP_DAYS: 90,
  DEFAULT_STATS_DAYS: 30,
} as const;

/**
 * Database Query Constraints
 * Veritabanı sorguları için sınırlar
 */
export const DB_CONSTRAINTS = {
  RECENT_ERRORS_LIMIT: 10,
  TOP_ACTIONS_LIMIT: 10,
} as const;

// ==================== LOG LEVELS ====================

/**
 * Valid Log Levels
 * Geçerli log seviyeleri
 */
export const LOG_LEVELS = ['info', 'warning', 'error', 'debug'] as const;

// ==================== LOG MODULES ====================

/**
 * Valid Log Modules
 * Geçerli log modülleri
 */
export const LOG_MODULES = [
  'auth', 
  'rss', 
  'news', 
  'settings', 
  'forum', 
  'users', 
  'reports', 
  'notification',
  'automation'
] as const;

// ==================== ERROR MESSAGES ====================

/**
 * Log Error Messages
 * Standart hata mesajları
 */
export const LOG_ERROR_MESSAGES = {
  LOG_CREATION_FAILED: 'Log kaydı oluşturulamadı',
  LOG_NOT_FOUND: 'Log kaydı bulunamadı',
  LOGS_FETCH_FAILED: 'Log kayıtları getirilemedi',
  METADATA_TOO_LARGE: 'Metadata boyutu çok büyük (maksimum 1MB)',
  INVALID_DATE_RANGE: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır',
  MIN_RETENTION_ERROR: 'Güvenlik için en az 30 günlük log tutulmalıdır',
  MAX_CLEANUP_ERROR: 'Maksimum 10 yıllık log temizlenebilir',
  CLEANUP_FAILED: 'Log temizleme işlemi sırasında bir hata oluştu',
  STATS_FETCH_FAILED: 'Log istatistikleri alınamadı',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmuyor',
} as const;

/**
 * Log Success Messages
 * Standart başarı mesajları
 */
export const LOG_SUCCESS_MESSAGES = {
  LOG_CREATED: 'Log kaydı başarıyla oluşturuldu',
  LOGS_FETCHED: 'Log kayıtları başarıyla getirildi',
  LOG_FETCHED: 'Log kaydı başarıyla getirildi',
  STATS_FETCHED: 'Log istatistikleri başarıyla getirildi',
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

/**
 * Validation Error Messages
 * Form validasyon hata mesajları
 */
export const LOG_VALIDATION_MESSAGES = {
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
  INVALID_DATE_RANGE: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır',
  MESSAGE_REQUIRED: 'Log mesajı boş olamaz',
  MESSAGE_TOO_LONG: `Log mesajı en fazla ${MESSAGE_CONSTRAINTS.MAX_LENGTH} karakter olabilir`,
  INVALID_LOG_LEVEL: 'Geçerli bir log seviyesi seçiniz (info, warning, error, debug)',
  INVALID_MODULE: 'Geçerli bir modül seçiniz (auth, rss, news, settings, forum, users, reports, notification)',
  ACTION_TOO_LONG: `Aksiyon adı en fazla ${MODULE_ACTION_CONSTRAINTS.ACTION_MAX_LENGTH} karakter olabilir`,
  INVALID_USER_ID: 'Geçerli bir kullanıcı ID\'si giriniz',
  INVALID_LOG_ID: 'Geçerli bir log ID\'si giriniz',
  INVALID_START_DATE: 'Geçerli bir başlangıç tarihi giriniz (ISO format)',
  INVALID_END_DATE: 'Geçerli bir bitiş tarihi giriniz (ISO format)',
  INVALID_PAGE: 'Sayfa numarası pozitif olmalıdır',
  INVALID_LIMIT: `Limit ${QUERY_CONSTRAINTS.LIMIT_MIN}-${QUERY_CONSTRAINTS.LIMIT_MAX} arasında olmalıdır`,
  SEARCH_TOO_LONG: `Arama terimi en fazla ${QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH} karakter olabilir`,
  INVALID_METADATA: 'Metadata geçerli bir JSON objesi olmalıdır',
} as const; 