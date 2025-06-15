/**
 * RSS Feature Constants
 * 
 * RSS modülü için tüm sabit değerleri içerir.
 * Validation, business logic ve message sabitleri.
 * 
 */

// ==================== VALIDATION CONSTANTS ====================

/**
 * RSS Source Name Constraints
 * RSS kaynak adı için minimum/maksimum değerler
 */
export const RSS_NAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 255,
} as const;

/**
 * RSS Description Constraints
 * RSS açıklama için maksimum değer
 */
export const RSS_DESCRIPTION_CONSTRAINTS = {
  MAX_LENGTH: 1000,
} as const;

/**
 * RSS URL Validation
 * URL doğrulama için regex pattern
 */
export const RSS_URL_VALIDATION = {
  REGEX: /^https?:\/\/.+/,
} as const;

/**
 * RSS Fetch Constraints
 * RSS çekme işlemi için sınırlar
 */
export const RSS_FETCH_CONSTRAINTS = {
  MAX_ITEMS_MIN: 1,
  MAX_ITEMS_MAX: 100,
} as const;

/**
 * RSS Query Constraints
 * RSS sorgu parametreleri için sınırlar
 */
export const RSS_QUERY_CONSTRAINTS = {
  PAGE_MIN: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 10,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
} as const;

/**
 * RSS Parser Configuration
 * RSS parser için yapılandırma sabitleri
 */
export const RSS_PARSER_CONFIG = {
  TIMEOUT: 10000, // 10 saniye
  USER_AGENT: 'AI News Bot/1.0',
  ACCEPT_HEADER: 'application/rss+xml, application/xml, text/xml',
} as const;

/**
 * RSS Similarity Detection
 * Benzerlik tespiti için eşik değerleri
 */
export const RSS_SIMILARITY_CONFIG = {
  DEFAULT_THRESHOLD: 0.85,
} as const;

// ==================== ERROR MESSAGES ====================

/**
 * RSS Error Messages
 * RSS işlemleri için hata mesajları
 */
export const RSS_ERROR_MESSAGES = {
  // Source Management Errors
  SOURCE_NOT_FOUND: 'RSS kaynağı bulunamadı',
  SOURCE_CREATE_FAILED: 'RSS kaynağı oluşturulamadı',
  SOURCE_UPDATE_FAILED: 'RSS kaynağı güncellenemedi',
  SOURCE_DELETE_FAILED: 'RSS kaynağı silinemedi',
  SOURCE_FETCH_FAILED: 'RSS kaynakları getirilemedi',
  
  // URL Validation Errors
  URL_DUPLICATE: 'Bu RSS URL\'i zaten mevcut',
  URL_DUPLICATE_OTHER: 'Bu RSS URL\'i zaten başka bir kaynak tarafından kullanılıyor',
  URL_INVALID_FEED: 'RSS feed\'e erişilemiyor veya geçersiz format',
  
  // Fetch Operation Errors
  FEED_PARSE_FAILED: 'RSS feed parse edilemedi',
  FEED_FETCH_FAILED: 'RSS feed çekme işlemi başarısız',
  
  // General Errors
  OPERATION_FAILED: 'İşlem sırasında bir hata oluştu',
  UNAUTHORIZED: 'Yetkilendirme gerekli',
  INVALID_DATA_FORMAT: 'Geçersiz veri formatı',
  INVALID_QUERY_PARAMS: 'Geçersiz sorgu parametreleri',
  INVALID_SOURCE_ID: 'Geçerli bir RSS kaynak ID giriniz',
} as const;

// ==================== SUCCESS MESSAGES ====================

/**
 * RSS Success Messages
 * RSS işlemleri için başarı mesajları
 */
export const RSS_SUCCESS_MESSAGES = {
  SOURCE_CREATED: 'RSS kaynağı başarıyla oluşturuldu',
  SOURCE_UPDATED: 'RSS kaynağı başarıyla güncellendi',
  SOURCE_DELETED: 'RSS kaynağı başarıyla silindi',
  FEEDS_FETCHED: 'RSS feed\'leri başarıyla çekildi',
  FEED_FETCHED: 'RSS feed başarıyla çekildi',
} as const;

// ==================== VALIDATION MESSAGES ====================

/**
 * RSS Validation Messages
 * RSS doğrulama için mesajlar
 */
export const RSS_VALIDATION_MESSAGES = {
  // Name Validation
  NAME_REQUIRED: 'RSS kaynak adı zorunludur',
  NAME_MIN_LENGTH: `RSS kaynak adı en az ${RSS_NAME_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  NAME_MAX_LENGTH: `RSS kaynak adı en fazla ${RSS_NAME_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  
  // URL Validation
  URL_REQUIRED: 'RSS URL zorunludur',
  URL_INVALID: 'Geçerli bir HTTP/HTTPS URL giriniz',
  
  // Description Validation
  DESCRIPTION_MAX_LENGTH: `Açıklama en fazla ${RSS_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`,
  
  // Fetch Validation
  MAX_ITEMS_INVALID: 'Maksimum öğe sayısı tam sayı olmalıdır',
  MAX_ITEMS_MIN: `Maksimum öğe sayısı en az ${RSS_FETCH_CONSTRAINTS.MAX_ITEMS_MIN} olmalıdır`,
  MAX_ITEMS_MAX: `Maksimum öğe sayısı en fazla ${RSS_FETCH_CONSTRAINTS.MAX_ITEMS_MAX} olmalıdır`,
  
  // Query Validation
  PAGE_INVALID: 'Sayfa numarası geçerli bir sayı olmalıdır',
  PAGE_MIN: `Sayfa numarası en az ${RSS_QUERY_CONSTRAINTS.PAGE_MIN} olmalıdır`,
  LIMIT_INVALID: 'Limit geçerli bir sayı olmalıdır',
  LIMIT_RANGE: `Limit ${RSS_QUERY_CONSTRAINTS.LIMIT_MIN}-${RSS_QUERY_CONSTRAINTS.LIMIT_MAX} arasında olmalıdır`,
  ACTIVE_STATUS_INVALID: 'Aktif durumu true veya false olmalıdır',
  SEARCH_MIN_LENGTH: `Arama terimi en az ${RSS_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH} karakter olmalıdır`,
  SEARCH_MAX_LENGTH: `Arama terimi en fazla ${RSS_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH} karakter olmalıdır`,
  
  // ID Validation
  SOURCE_ID_INVALID: 'Geçerli bir RSS kaynak ID giriniz',
  UUID_INVALID: 'Geçerli bir kaynak ID giriniz',
} as const; 