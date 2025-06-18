/**
 * Automation Feature Constants
 * 
 * Otomatikleştirme modülü için tüm sabit değerler ve konfigürasyonlar.
 * Scheduler, retry mekanizması ve job queue ayarları.
 */

// ==================== SCHEDULER CONFIG ====================

export const SCHEDULER_CONFIG = {
  // RSS Fetch Schedule
  RSS_FETCH_INTERVAL: '*/30 * * * *', // Her 30 dakikada bir
  RSS_FETCH_TIMEOUT: 300000, // 5 dakika timeout
  
  // AI Processing Schedule  
  AI_PROCESSING_INTERVAL: '*/1 * * * *', // Her 1 dakikada bir (test için)
  AI_PROCESSING_TIMEOUT: 600000, // 10 dakika timeout
  AI_BATCH_SIZE: 5, // Aynı anda işlenecek haber sayısı
  
  // Health Check Schedule
  HEALTH_CHECK_INTERVAL: '*/15 * * * *', // Her 15 dakikada bir
  
  // Cleanup Schedule
  CLEANUP_INTERVAL: '0 2 * * *', // Her gün saat 02:00'da
  CLEANUP_RETENTION_DAYS: 30, // 30 günden eski logları temizle
  
  // Graceful shutdown
  GRACEFUL_SHUTDOWN_TIMEOUT: 60000, // 60 saniye
} as const;

// ==================== RETRY CONFIG ====================

export const RETRY_CONFIG = {
  // RSS Retry Settings
  RSS_MAX_RETRIES: 3,
  RSS_RETRY_DELAY: 60000, // 1 dakika
  RSS_EXPONENTIAL_BACKOFF: true,
  RSS_MAX_DELAY: 300000, // 5 dakika max
  
  // AI Processing Retry Settings
  AI_MAX_RETRIES: 1,
  AI_RETRY_DELAY: 120000, // 2 dakika
  AI_LINEAR_BACKOFF: true,
  AI_MAX_DELAY: 600000, // 10 dakika max
  
  // Circuit Breaker Settings
  CIRCUIT_BREAKER_THRESHOLD: 5, // 5 ardışık hata
  CIRCUIT_BREAKER_TIMEOUT: 300000, // 5 dakika bekle
  CIRCUIT_BREAKER_RESET_TIMEOUT: 600000, // 10 dakika sonra reset
} as const;

// ==================== RATE LIMITING ====================

export const RATE_LIMIT_CONFIG = {
  // RSS Rate Limiting
  RSS_REQUESTS_PER_MINUTE: 30,
  RSS_CONCURRENT_LIMIT: 5,
  
  // AI API Rate Limiting
  AI_REQUESTS_PER_MINUTE: 10,
  AI_CONCURRENT_LIMIT: 3,
  
  // Database Rate Limiting
  DB_BATCH_SIZE: 10,
  DB_BATCH_DELAY: 1000, // 1 saniye
} as const;

// ==================== MONITORING CONFIG ====================

export const MONITORING_CONFIG = {
  // Performance Thresholds
  RSS_FETCH_MAX_DURATION: 300000, // 5 dakika
  AI_PROCESSING_MAX_DURATION: 600000, // 10 dakika
  DB_QUERY_MAX_DURATION: 30000, // 30 saniye
  
  // Alert Thresholds
  ERROR_RATE_THRESHOLD: 0.1, // %10 hata oranı
  QUEUE_SIZE_THRESHOLD: 100, // 100 job queue'da bekliyor
  MEMORY_USAGE_THRESHOLD: 0.8, // %80 memory kullanımı
  
  // Health Check Settings
  HEALTH_CHECK_TIMEOUT: 10000, // 10 saniye
  HEALTH_CHECK_RETRY: 3,
} as const;

// ==================== JOB TYPES ====================

export const JOB_TYPES = {
  RSS_FETCH: 'rss_fetch',
  AI_PROCESSING: 'ai_processing',
  BATCH_PROCESSING: 'batch_processing',
  CLEANUP: 'cleanup',
  HEALTH_CHECK: 'health_check',
  RETRY_FAILED: 'retry_failed',
} as const;

// ==================== JOB PRIORITIES ====================

export const JOB_PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
} as const;

// ==================== ERROR MESSAGES ====================

export const AUTOMATION_ERROR_MESSAGES = {
  // Scheduler errors
  SCHEDULER_START_FAILED: 'Scheduler başlatılamadı',
  SCHEDULER_STOP_FAILED: 'Scheduler durdurulamadı',
  JOB_CREATION_FAILED: 'Job oluşturulamadı',
  JOB_EXECUTION_FAILED: 'Job çalıştırılamadı',
  
  // RSS errors
  RSS_FETCH_FAILED: 'RSS çekme işlemi başarısız',
  RSS_SOURCE_UNAVAILABLE: 'RSS kaynağı erişilemez durumda',
  RSS_TIMEOUT: 'RSS çekme işlemi zaman aşımına uğradı',
  
  // AI processing errors
  AI_PROCESSING_FAILED: 'AI işleme başarısız',
  AI_SERVICE_UNAVAILABLE: 'AI servisi erişilemez durumda',
  AI_TIMEOUT: 'AI işleme zaman aşımına uğradı',
  AI_QUOTA_EXCEEDED: 'AI API kotası aşıldı',
  
  // Queue errors
  QUEUE_CONNECTION_FAILED: 'Queue bağlantısı başarısız',
  QUEUE_FULL: 'Queue kapasitesi doldu',
  QUEUE_PROCESSING_FAILED: 'Queue işleme hatası',
  
  // Circuit breaker errors
  CIRCUIT_BREAKER_OPEN: 'Circuit breaker açık - servis geçici olarak devre dışı',
  SERVICE_DEGRADED: 'Servis performansı düşük',
  
  // General errors
  OPERATION_FAILED: 'Otomatikleştirme işlemi başarısız',
  CONFIGURATION_ERROR: 'Konfigürasyon hatası',
  RESOURCE_EXHAUSTED: 'Sistem kaynakları tükendi',
} as const;

// ==================== SUCCESS MESSAGES ====================

export const AUTOMATION_SUCCESS_MESSAGES = {
  // Scheduler success
  SCHEDULER_STARTED: 'Scheduler başarıyla başlatıldı',
  SCHEDULER_STOPPED: 'Scheduler başarıyla durduruldu',
  JOB_COMPLETED: 'Job başarıyla tamamlandı',
  
  // RSS success
  RSS_FETCH_COMPLETED: 'RSS çekme işlemi tamamlandı',
  RSS_SOURCES_UPDATED: 'RSS kaynakları güncellendi',
  
  // AI processing success
  AI_PROCESSING_COMPLETED: 'AI işleme tamamlandı',
  BATCH_PROCESSING_COMPLETED: 'Toplu işleme tamamlandı',
  
  // Health check success
  HEALTH_CHECK_PASSED: 'Sistem sağlık kontrolü başarılı',
  ALL_SERVICES_HEALTHY: 'Tüm servisler sağlıklı',
  
  // Cleanup success
  CLEANUP_COMPLETED: 'Temizlik işlemi tamamlandı',
  OLD_LOGS_REMOVED: 'Eski loglar temizlendi',
} as const;

// ==================== STATUS TYPES ====================

export const AUTOMATION_STATUS = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  PAUSED: 'paused',
  ERROR: 'error',
  MAINTENANCE: 'maintenance',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  CANCELLED: 'cancelled',
} as const;

// ==================== HEALTH CHECK TYPES ====================

export const HEALTH_CHECK_TYPES = {
  DATABASE: 'database',
  RSS_SOURCES: 'rss_sources',
  AI_SERVICE: 'ai_service',
  QUEUE: 'queue',
  MEMORY: 'memory',
  DISK: 'disk',
} as const; 