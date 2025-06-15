/**
 * System Constants
 * 
 * Sistem ayarları, kategoriler ve genel sistem sabitleri.
 * Uygulama genelinde kullanılan sistem konfigürasyonları.
 * 
 */

// ==================== SETTING CATEGORIES ====================

/**
 * Setting Categories
 * Sistem ayar kategorileri
 */
export const SETTING_CATEGORIES = {
  GENERAL: 'general',     // Genel ayarlar
  RSS: 'rss',            // RSS feed ayarları
  AI: 'ai',              // AI/ML ayarları
  AUTH: 'auth',          // Kimlik doğrulama ayarları
  NEWS: 'news',          // Haber ayarları
  FORUM: 'forum',        // Forum ayarları
  EMAIL: 'email',        // E-posta ayarları
  SECURITY: 'security',  // Güvenlik ayarları
} as const;

// ==================== LOG LEVELS ====================

/**
 * Log Levels
 * Sistem log seviyeleri - önem sırasına göre
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',        // Debug bilgileri - en düşük seviye
  INFO: 'info',          // Bilgilendirme mesajları
  WARNING: 'warning',    // Uyarı mesajları
  ERROR: 'error',        // Hata mesajları - en yüksek seviye
} as const;

/**
 * Log Level Hierarchy
 * Log seviye hiyerarşisi - önem derecelerine göre sayısal değerler
 */
export const LOG_LEVEL_HIERARCHY = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARNING]: 2,
  [LOG_LEVELS.ERROR]: 3,
} as const;

// ==================== SYSTEM MODULES ====================

/**
 * System Modules
 * Sistem modülleri - log ve izleme için
 */
export const SYSTEM_MODULES = {
  AUTH: 'auth',          // Kimlik doğrulama modülü
  RSS: 'rss',            // RSS feed modülü
  LOGS: 'logs',          // Log yönetimi modülü
  SETTINGS: 'settings',  // Ayar yönetimi modülü
  AI: 'ai',              // AI/ML modülü
  NEWS: 'news',          // Haber modülü
  FORUM: 'forum',        // Forum modülü
  USER: 'user',          // Kullanıcı yönetimi modülü
  SYSTEM: 'system',      // Sistem yönetimi modülü
} as const;

// ==================== ENVIRONMENT TYPES ====================

/**
 * Environment Types
 * Uygulama ortam tipleri
 */
export const ENVIRONMENT_TYPES = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

// ==================== CACHE KEYS ====================

/**
 * Cache Keys
 * Redis/Memory cache anahtarları
 */
export const CACHE_KEYS = {
  USER_SESSION: 'user_session',
  RSS_FEEDS: 'rss_feeds',
  SETTINGS: 'settings',
  NEWS_CACHE: 'news_cache',
  AI_EMBEDDINGS: 'ai_embeddings',
} as const;

// ==================== CACHE TTL (Time To Live) ====================

/**
 * Cache TTL Values (in seconds)
 * Cache yaşam süreleri
 */
export const CACHE_TTL = {
  SHORT: 300,      // 5 dakika
  MEDIUM: 1800,    // 30 dakika
  LONG: 3600,      // 1 saat
  VERY_LONG: 86400, // 24 saat
} as const;

// ==================== PAGINATION DEFAULTS ====================

/**
 * Pagination Defaults
 * Sayfalama için varsayılan değerler
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ==================== FILE UPLOAD LIMITS ====================

/**
 * File Upload Limits
 * Dosya yükleme sınırları
 */
export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// ==================== AI EMBEDDING CONFIGURATION ====================

/**
 * AI Embedding Configuration
 * Vector embedding işlemleri için sabitler
 */
export const AI_EMBEDDING_CONFIG = {
  SIMILARITY_THRESHOLD: 0.85,      // Benzerlik eşiği (%85)
  MAX_TEXT_LENGTH: 512,            // Maksimum metin uzunluğu
  REQUEST_TIMEOUT: 30000,          // İstek timeout (30 saniye)
  VECTOR_DIMENSIONS: 384,          // Vector boyutu
  BATCH_SIZE: 5,                   // Batch işlem boyutu
  MIN_TEXT_LENGTH: 10,             // Minimum metin uzunluğu
} as const;

// ==================== WEB SCRAPING CONFIGURATION ====================

/**
 * Web Scraping Configuration
 * Web scraping işlemleri için sabitler
 */
export const WEB_SCRAPING_CONFIG = {
  DEFAULT_TIMEOUT: 15000,          // Varsayılan timeout (15 saniye)
  MAX_RETRIES: 3,                  // Maksimum yeniden deneme
  MIN_CONTENT_LENGTH: 100,         // Minimum içerik uzunluğu
  MIN_TITLE_LENGTH: 5,             // Minimum başlık uzunluğu
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ACCEPT_HEADER: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  ACCEPT_LANGUAGE: 'tr-TR,tr;q=0.9,en;q=0.8',
  ACCEPT_ENCODING: 'gzip, deflate, br',
} as const; 