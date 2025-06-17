/**
 * News Feature Constants
 * 
 * News modülü için tüm sabit değerler ve konfigürasyonlar.
 * Hata mesajları, başarı mesajları, limitler ve ayarlar.
 */

// ==================== ERROR MESSAGES ====================

export const NEWS_ERROR_MESSAGES = {
  // General errors
  OPERATION_FAILED: 'Haber işlemi başarısız oldu',
  INVALID_REQUEST: 'Geçersiz istek verisi',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmuyor',
  
  // News CRUD errors
  NEWS_NOT_FOUND: 'Haber bulunamadı',
  NEWS_CREATE_FAILED: 'Haber oluşturulamadı',
  NEWS_UPDATE_FAILED: 'Haber güncellenemedi',
  NEWS_DELETE_FAILED: 'Haber silinemedi',
  NEWS_ALREADY_EXISTS: 'Bu haber zaten mevcut',
  
  // Category errors
  CATEGORY_NOT_FOUND: 'Kategori bulunamadı',
  CATEGORY_CREATE_FAILED: 'Kategori oluşturulamadı',
  CATEGORY_UPDATE_FAILED: 'Kategori güncellenemedi',
  CATEGORY_DELETE_FAILED: 'Kategori silinemedi',
  CATEGORY_IN_USE: 'Kategori kullanımda olduğu için silinemez',
  CATEGORY_SLUG_EXISTS: 'Bu slug zaten kullanılıyor',
  
  // Generation errors
  GENERATION_FAILED: 'Haber üretimi başarısız oldu',
  GENERATION_VALIDATION_FAILED: 'Haber içeriği geçerlilik kontrolünden geçemedi',
  GENERATION_NO_CATEGORY_MATCH: 'Haber için uygun kategori bulunamadı',
  GENERATION_CONTENT_TOO_SHORT: 'Haber içeriği çok kısa',
  GENERATION_VIDEO_CONTENT: 'Video tabanlı içerik işlenemez',
  GENERATION_PLACEHOLDER_CONTENT: 'Eksik veya placeholder içerik tespit edildi',
  GENERATION_QUESTION_ONLY: 'Sadece sorulardan oluşan içerik işlenemez',
  GENERATION_AI_SERVICE_ERROR: 'AI servisi hatası',
  GENERATION_TIMEOUT: 'Haber üretimi zaman aşımına uğradı',
  
  // Source errors
  SOURCE_SAVE_FAILED: 'Kaynak bilgisi kaydedilemedi',
  SOURCE_DUPLICATE: 'Bu kaynak zaten mevcut',
  
  // Validation errors
  VALIDATION_TITLE_REQUIRED: 'Başlık gereklidir',
  VALIDATION_TITLE_TOO_LONG: 'Başlık çok uzun',
  VALIDATION_CONTENT_REQUIRED: 'İçerik gereklidir',
  VALIDATION_CONTENT_TOO_SHORT: 'İçerik çok kısa',
  VALIDATION_CONTENT_TOO_LONG: 'İçerik çok uzun',
  VALIDATION_SLUG_INVALID: 'Geçersiz slug formatı',
  VALIDATION_CATEGORY_INVALID: 'Geçersiz kategori',
  VALIDATION_STATUS_INVALID: 'Geçersiz durum',
  VALIDATION_CONFIDENCE_INVALID: 'Güven skoru 0-1 arasında olmalıdır',
} as const;

// ==================== SUCCESS MESSAGES ====================

export const NEWS_SUCCESS_MESSAGES = {
  // News CRUD success
  NEWS_CREATED: 'Haber başarıyla oluşturuldu',
  NEWS_UPDATED: 'Haber başarıyla güncellendi',
  NEWS_DELETED: 'Haber başarıyla silindi',
  NEWS_PUBLISHED: 'Haber başarıyla yayınlandı',
  NEWS_UNPUBLISHED: 'Haber yayından kaldırıldı',
  
  // Category success
  CATEGORY_CREATED: 'Kategori başarıyla oluşturuldu',
  CATEGORY_UPDATED: 'Kategori başarıyla güncellendi',
  CATEGORY_DELETED: 'Kategori başarıyla silindi',
  
  // Generation success
  GENERATION_COMPLETED: 'Haber başarıyla üretildi',
  GENERATION_PROCESSED: 'Haber işleme tamamlandı',
  SOURCES_SAVED: 'Kaynak bilgileri kaydedildi',
  DIFFERENCES_ANALYZED: 'Fark analizi tamamlandı',
} as const;

// ==================== QUERY CONSTRAINTS ====================

export const NEWS_QUERY_CONSTRAINTS = {
  // Pagination
  PAGE_MIN: 1,
  PAGE_DEFAULT: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
  
  // Search
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
  
  // Content length
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MIN_LENGTH: 100,
  CONTENT_MAX_LENGTH: 50000,
  SUMMARY_MAX_LENGTH: 500,
  SLUG_MAX_LENGTH: 100,
  
  // Category
  CATEGORY_NAME_MIN_LENGTH: 2,
  CATEGORY_NAME_MAX_LENGTH: 50,
  CATEGORY_DESCRIPTION_MAX_LENGTH: 200,
} as const;

// ==================== NEWS GENERATION CONFIG ====================

export const NEWS_GENERATION_CONFIG = {
  // AI Processing
  MAX_PROCESSING_TIME: 300000, // 5 dakika (ms)
  CONFIDENCE_THRESHOLD: 0.6,
  MAX_SOURCES: 10,
  MAX_DIFFERENCES: 5,
  
  // Content validation
  MIN_CONTENT_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 150,
  
  // Research parameters
  MAX_SEARCH_QUERIES: 5,
  MAX_RESEARCH_ITERATIONS: 3,
  SEARCH_TIMEOUT: 30000, // 30 saniye
  
  // Quality filters
  VIDEO_KEYWORDS: [
    'video', 'izle', 'detaylar videoda', 'videolu haber',
    'canlı yayın', 'video galeri', 'izlemek için tıklayın'
  ],
  PLACEHOLDER_KEYWORDS: [
    'güncelleniyor', 'yakında', 'detaylar gelecek', 'haberle ilgili',
    'daha fazla bilgi', 'gelişen haberler', 'son dakika güncelleme'
  ],
  QUESTION_THRESHOLD: 3, // Maksimum soru işareti sayısı
} as const;

// ==================== NEWS VALIDATION RULES ====================

export const NEWS_VALIDATION_RULES = {
  // Content quality rules
  MIN_SENTENCE_COUNT: 3,
  MIN_WORD_COUNT: 50,
  MAX_QUESTION_RATIO: 0.3, // İçeriğin %30'u soru olamaz
  
  // Category matching
  CATEGORY_MATCH_THRESHOLD: 0.7,
  
  // Source validation
  MIN_SOURCES: 1,
  MAX_SOURCES_PER_NEWS: 15,
  
  // Confidence scoring
  MIN_CONFIDENCE: 0.5,
  HIGH_CONFIDENCE: 0.8,
  
  // Processing limits
  MAX_RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 5,
} as const;

// ==================== STATUS TYPES ====================

export const NEWS_STATUSES = [
  'pending',
  'processing', 
  'published',
  'rejected'
] as const;

// ==================== CATEGORY VALIDATION ====================

export const CATEGORY_VALIDATION_RULES = {
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  RESERVED_SLUGS: [
    'admin', 'api', 'www', 'app', 'news', 'category',
    'categories', 'search', 'archive', 'tag', 'tags'
  ],
} as const; 