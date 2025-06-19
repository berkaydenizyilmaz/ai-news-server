/**
 * Forum Feature Constants
 * 
 * Forum modülü için tüm sabit değerler.
 * Hata mesajları, başarı mesajları, sınırlar ve konfigürasyonlar.
 */

// ==================== FORUM CONSTRAINTS ====================

/**
 * Forum Query Constraints
 * 
 * Sayfalama ve sorgu sınırları.
 */
export const FORUM_QUERY_CONSTRAINTS = {
  PAGE_MIN: 1,
  PAGE_DEFAULT: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 50,
  LIMIT_DEFAULT: 20,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
} as const;

/**
 * Forum Topic Constraints
 * 
 * Forum konusu sınırları.
 */
export const FORUM_TOPIC_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 500,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 10000,
  SLUG_MAX_LENGTH: 600,
} as const;

/**
 * Forum Post Constraints
 * 
 * Forum post sınırları.
 */
export const FORUM_POST_CONSTRAINTS = {
  CONTENT_MIN_LENGTH: 3,
  CONTENT_MAX_LENGTH: 5000,
} as const;

/**
 * Forum Category Constraints
 * 
 * Forum kategori sınırları.
 */
export const FORUM_CATEGORY_CONSTRAINTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  SLUG_MAX_LENGTH: 300,
} as const;

/**
 * Forum Moderation Constraints
 * 
 * Moderasyon işlemleri sınırları.
 */
export const FORUM_MODERATION_CONSTRAINTS = {
  MAX_BULK_OPERATIONS: 50,
  REASON_MAX_LENGTH: 500,
} as const;

// ==================== ERROR MESSAGES ====================

/**
 * Forum Error Messages
 * 
 * Hata durumlarında döndürülecek mesajlar.
 */
export const FORUM_ERROR_MESSAGES = {
  // Genel hatalar
  OPERATION_FAILED: 'İşlem başarısız oldu',
  VALIDATION_FAILED: 'Geçersiz veri',
  UNAUTHORIZED: 'Bu işlem için yetkiniz yok',
  
  // Category hataları
  CATEGORY_NOT_FOUND: 'Kategori bulunamadı',
  CATEGORY_CREATE_FAILED: 'Kategori oluşturulamadı',
  CATEGORY_UPDATE_FAILED: 'Kategori güncellenemedi',
  CATEGORY_DELETE_FAILED: 'Kategori silinemedi',
  CATEGORY_HAS_TOPICS: 'Bu kategoride konular bulunuyor, silinemez',
  
  // Topic hataları
  TOPIC_NOT_FOUND: 'Konu bulunamadı',
  TOPIC_CREATE_FAILED: 'Konu oluşturulamadı',
  TOPIC_UPDATE_FAILED: 'Konu güncellenemedi',
  TOPIC_DELETE_FAILED: 'Konu silinemedi',
  TOPIC_LOCKED: 'Bu konu kilitli, yanıt verilemez',
  
  // Post hataları
  POST_NOT_FOUND: 'Gönderi bulunamadı',
  POST_CREATE_FAILED: 'Gönderi oluşturulamadı',
  POST_UPDATE_FAILED: 'Gönderi güncellenemedi',
  POST_DELETE_FAILED: 'Gönderi silinemedi',
  
  // Content hataları
  TITLE_TOO_SHORT: `Başlık en az ${FORUM_TOPIC_CONSTRAINTS.TITLE_MIN_LENGTH} karakter olmalıdır`,
  TITLE_TOO_LONG: `Başlık en fazla ${FORUM_TOPIC_CONSTRAINTS.TITLE_MAX_LENGTH} karakter olabilir`,
  CONTENT_TOO_SHORT: `İçerik en az ${FORUM_POST_CONSTRAINTS.CONTENT_MIN_LENGTH} karakter olmalıdır`,
  CONTENT_TOO_LONG: `İçerik en fazla ${FORUM_POST_CONSTRAINTS.CONTENT_MAX_LENGTH} karakter olabilir`,
  CONTENT_EMPTY: 'İçerik boş olamaz',
  
  // Permission hataları
  CANNOT_EDIT: 'Bu içeriği düzenleyemezsiniz',
  CANNOT_DELETE: 'Bu içeriği silemezsiniz',
  CANNOT_PIN: 'Konuları sabitleyemezsiniz',
  CANNOT_LOCK: 'Konuları kilitleyemezsiniz',
  CANNOT_MODERATE: 'Moderasyon yetkiniz yok',
  
  // Like hataları
  LIKE_FAILED: 'Beğeni işlemi başarısız',
  ALREADY_LIKED: 'Bu içeriği zaten beğendiniz',
  CANNOT_LIKE_OWN: 'Kendi içeriğinizi beğenemezsiniz',
  
  // Moderation hataları
  BULK_OPERATION_LIMIT_EXCEEDED: `En fazla ${FORUM_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS} öğe seçilebilir`,
  INVALID_MODERATION_ACTION: 'Geçersiz moderasyon işlemi',
  
  // Statistics hataları
  STATISTICS_FETCH_FAILED: 'İstatistikler alınamadı',
} as const;

// ==================== SUCCESS MESSAGES ====================

/**
 * Forum Success Messages
 * 
 * Başarılı işlemler için mesajlar.
 */
export const FORUM_SUCCESS_MESSAGES = {
  // Category işlemleri
  CATEGORY_CREATED: 'Kategori başarıyla oluşturuldu',
  CATEGORY_UPDATED: 'Kategori başarıyla güncellendi',
  CATEGORY_DELETED: 'Kategori başarıyla silindi',
  
  // Topic işlemleri
  TOPIC_CREATED: 'Konu başarıyla oluşturuldu',
  TOPIC_UPDATED: 'Konu başarıyla güncellendi',
  TOPIC_DELETED: 'Konu başarıyla silindi',
  TOPIC_PINNED: 'Konu sabitlendi',
  TOPIC_UNPINNED: 'Konu sabitleme kaldırıldı',
  TOPIC_LOCKED: 'Konu kilitlendi',
  TOPIC_UNLOCKED: 'Konu kilidi kaldırıldı',
  
  // Post işlemleri
  POST_CREATED: 'Gönderi başarıyla oluşturuldu',
  POST_UPDATED: 'Gönderi başarıyla güncellendi',
  POST_DELETED: 'Gönderi başarıyla silindi',
  
  // Like işlemleri
  LIKED: 'İçerik beğenildi',
  UNLIKED: 'Beğeni kaldırıldı',
  DISLIKED: 'İçerik beğenilmedi',
  
  // Moderation işlemleri
  BULK_OPERATION_COMPLETED: 'Toplu işlem tamamlandı',
  MODERATION_COMPLETED: 'Moderasyon işlemi tamamlandı',
} as const;

// ==================== FORUM PERMISSIONS ====================

/**
 * Forum Permission Rules
 * 
 * Forum işlemleri için yetki kuralları.
 */
export const FORUM_PERMISSIONS = {
  // Kategori yönetimi
  CAN_CREATE_CATEGORY: ['admin'] as string[],
  CAN_UPDATE_CATEGORY: ['admin'] as string[],
  CAN_DELETE_CATEGORY: ['admin'] as string[],
  
  // Konu işlemleri
  CAN_CREATE_TOPIC: ['user', 'moderator', 'admin'] as string[],
  CAN_UPDATE_OWN_TOPIC: ['user', 'moderator', 'admin'] as string[],
  CAN_DELETE_OWN_TOPIC: ['user', 'moderator', 'admin'] as string[],
  CAN_PIN_TOPIC: ['moderator', 'admin'] as string[],
  CAN_LOCK_TOPIC: ['moderator', 'admin'] as string[],
  
  // Post işlemleri
  CAN_CREATE_POST: ['user', 'moderator', 'admin'] as string[],
  CAN_UPDATE_OWN_POST: ['user', 'moderator', 'admin'] as string[],
  CAN_DELETE_OWN_POST: ['user', 'moderator', 'admin'] as string[],
  
  // Moderasyon
  CAN_MODERATE: ['moderator', 'admin'] as string[],
  CAN_VIEW_DELETED: ['moderator', 'admin'] as string[],
  
  // Like işlemleri
  CAN_LIKE: ['user', 'moderator', 'admin'] as string[],
  
  // İstatistikler
  CAN_VIEW_STATISTICS: ['moderator', 'admin'] as string[],
  
  // Düzenleme süresi sınırı
  EDIT_TIME_LIMIT_HOURS: 24,
} as const;

// ==================== FORUM SORT OPTIONS ====================

/**
 * Forum Sort Options
 * 
 * Forum sıralama seçenekleri.
 */
export const FORUM_SORT_OPTIONS = {
  NEWEST_FIRST: 'created_at_desc',
  OLDEST_FIRST: 'created_at_asc',
  MOST_REPLIES: 'reply_count_desc',
  MOST_LIKES: 'like_count_desc',
  LAST_REPLY: 'last_reply_at_desc',
  RECENTLY_UPDATED: 'updated_at_desc',
} as const;

// ==================== FORUM STATUS ====================

/**
 * Forum Status Types
 * 
 * Forum durumları.
 */
export const FORUM_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  DELETED: 'deleted',
} as const;

// ==================== MODERATION ACTIONS ====================

/**
 * Forum Moderation Actions
 * 
 * Moderasyon işlem tipleri.
 */
export const FORUM_MODERATION_ACTIONS = {
  DELETE: 'delete',
  RESTORE: 'restore',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  PIN: 'pin',
  UNPIN: 'unpin',
} as const; 