/**
 * Comments Feature Constants
 * 
 * Comments modülü için tüm sabit değerler.
 * Hata mesajları, başarı mesajları, sınırlar ve konfigürasyonlar.
 */

// ==================== COMMENT CONSTRAINTS ====================

/**
 * Comment Query Constraints
 * 
 * Sayfalama ve sorgu sınırları.
 */
export const COMMENT_QUERY_CONSTRAINTS = {
  PAGE_MIN: 1,
  PAGE_DEFAULT: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
  MAX_REPLY_DEPTH: 5, // Maksimum yorum derinliği
} as const;

/**
 * Comment Content Constraints
 * 
 * Yorum içeriği sınırları.
 */
export const COMMENT_CONTENT_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 2000,
  TRIM_WHITESPACE: true,
} as const;

/**
 * Comment Moderation Constraints
 * 
 * Moderasyon işlemleri sınırları.
 */
export const COMMENT_MODERATION_CONSTRAINTS = {
  MAX_BULK_OPERATIONS: 50,
  REASON_MAX_LENGTH: 500,
} as const;

// ==================== ERROR MESSAGES ====================

/**
 * Comment Error Messages
 * 
 * Hata durumlarında döndürülecek mesajlar.
 */
export const COMMENT_ERROR_MESSAGES = {
  // Genel hatalar
  OPERATION_FAILED: 'İşlem başarısız oldu',
  VALIDATION_FAILED: 'Geçersiz veri',
  UNAUTHORIZED: 'Bu işlem için yetkiniz yok',
  
  // Comment CRUD hataları
  COMMENT_NOT_FOUND: 'Yorum bulunamadı',
  COMMENT_CREATE_FAILED: 'Yorum oluşturulamadı',
  COMMENT_UPDATE_FAILED: 'Yorum güncellenemedi',
  COMMENT_DELETE_FAILED: 'Yorum silinemedi',
  
  // Content hataları
  CONTENT_TOO_SHORT: `Yorum en az ${COMMENT_CONTENT_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
  CONTENT_TOO_LONG: `Yorum en fazla ${COMMENT_CONTENT_CONSTRAINTS.MAX_LENGTH} karakter olabilir`,
  CONTENT_EMPTY: 'Yorum içeriği boş olamaz',
  
  // Permission hataları
  CANNOT_EDIT: 'Bu yorumu düzenleyemezsiniz',
  CANNOT_DELETE: 'Bu yorumu silemezsiniz',
  CANNOT_REPLY: 'Bu yoruma yanıt veremezsiniz',
  
  // News hataları
  NEWS_NOT_FOUND: 'Haber bulunamadı',
  NEWS_COMMENTS_DISABLED: 'Bu haber için yorumlar kapatılmış',
  
  // Reply hataları
  PARENT_COMMENT_NOT_FOUND: 'Yanıtlanan yorum bulunamadı',
  MAX_REPLY_DEPTH_EXCEEDED: `Maksimum ${COMMENT_QUERY_CONSTRAINTS.MAX_REPLY_DEPTH} seviye yorum derinliği aşıldı`,
  CANNOT_REPLY_TO_DELETED: 'Silinmiş yoruma yanıt verilemez',
  
  // Moderation hataları
  BULK_OPERATION_LIMIT_EXCEEDED: `En fazla ${COMMENT_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS} yorum seçilebilir`,
  INVALID_MODERATION_ACTION: 'Geçersiz moderasyon işlemi',
  
  // Statistics hataları
  STATISTICS_FETCH_FAILED: 'İstatistikler alınamadı',
} as const;

// ==================== SUCCESS MESSAGES ====================

/**
 * Comment Success Messages
 * 
 * Başarılı işlemler için mesajlar.
 */
export const COMMENT_SUCCESS_MESSAGES = {
  COMMENT_CREATED: 'Yorum başarıyla oluşturuldu',
  COMMENT_UPDATED: 'Yorum başarıyla güncellendi',
  COMMENT_DELETED: 'Yorum başarıyla silindi',
  COMMENT_RESTORED: 'Yorum başarıyla geri yüklendi',
  BULK_OPERATION_COMPLETED: 'Toplu işlem tamamlandı',
  MODERATION_COMPLETED: 'Moderasyon işlemi tamamlandı',
} as const;

// ==================== COMMENT PERMISSIONS ====================

/**
 * Comment Permission Rules
 * 
 * Yorum işlemleri için yetki kuralları.
 */
export const COMMENT_PERMISSIONS = {
  // Yorum oluşturma
  CAN_CREATE: ['user', 'moderator', 'admin'] as string[],
  
  // Kendi yorumunu düzenleme (24 saat içinde)
  CAN_EDIT_OWN: ['user', 'moderator', 'admin'] as string[],
  EDIT_TIME_LIMIT_HOURS: 24,
  
  // Kendi yorumunu silme
  CAN_DELETE_OWN: ['user', 'moderator', 'admin'] as string[],
  
  // Başkasının yorumunu moderasyon
  CAN_MODERATE: ['moderator', 'admin'] as string[],
  
  // Silinmiş yorumları görme
  CAN_VIEW_DELETED: ['moderator', 'admin'] as string[],
  
  // İstatistikleri görme
  CAN_VIEW_STATISTICS: ['moderator', 'admin'] as string[],
};

// ==================== COMMENT SORT OPTIONS ====================

/**
 * Comment Sort Options
 * 
 * Yorum sıralama seçenekleri.
 */
export const COMMENT_SORT_OPTIONS = {
  NEWEST_FIRST: 'created_at_desc',
  OLDEST_FIRST: 'created_at_asc',
  RECENTLY_UPDATED: 'updated_at_desc',
} as const;

// ==================== COMMENT STATUS ====================

/**
 * Comment Status Types
 * 
 * Yorum durumları.
 */
export const COMMENT_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  FLAGGED: 'flagged',
  PENDING_MODERATION: 'pending_moderation',
} as const;

// ==================== MODERATION ACTIONS ====================

/**
 * Comment Moderation Actions
 * 
 * Moderasyon işlem tipleri.
 */
export const COMMENT_MODERATION_ACTIONS = {
  APPROVE: 'approve',
  DELETE: 'delete',
  RESTORE: 'restore',
  FLAG: 'flag',
  UNFLAG: 'unflag',
} as const; 