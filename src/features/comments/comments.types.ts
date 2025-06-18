/**
 * Comments Feature Type Definitions
 * 
 * Comments modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve yorum yapıları.
 */

import { Comment, CommentWithUser } from '@/core/types/database.types';

// ==================== COMMENT REQUEST DTOs ====================

/**
 * Comment Creation Request DTO
 * 
 * Yeni yorum oluşturma için gerekli veriler.
 */
export interface CreateCommentRequest {
  content: string;                  // Yorum içeriği
  processed_news_id: string;        // Haber ID'si
  parent_id?: string;              // Ana yorum ID'si (reply ise)
}

/**
 * Comment Update Request DTO
 * 
 * Mevcut yorumu güncelleme için gerekli veriler.
 */
export interface UpdateCommentRequest {
  content: string;                  // Güncellenmiş yorum içeriği
}

/**
 * Comment Query Request DTO
 * 
 * Yorum listesi için filtreleme ve sayfalama parametreleri.
 */
export interface CommentQueryRequest {
  processed_news_id: string;        // Haber ID'si
  page?: number;                   // Sayfa numarası
  limit?: number;                  // Sayfa başına öğe sayısı
  sort_by?: string;               // Sıralama alanı
  sort_order?: 'asc' | 'desc';    // Sıralama yönü
  include_deleted?: boolean;       // Silinmiş yorumları dahil et
}

/**
 * Bulk Moderation Request DTO
 * 
 * Toplu moderasyon işlemi için gerekli veriler.
 */
export interface BulkModerationRequest {
  comment_ids: string[];           // İşlem yapılacak yorum ID'leri
  action: 'delete' | 'restore';   // Yapılacak işlem
  reason?: string;                // Moderasyon sebebi (opsiyonel)
}

// ==================== COMMENT RESPONSE DTOs ====================

/**
 * Comment Statistics Interface
 * 
 * Yorum istatistikleri.
 */
export interface CommentStatistics {
  total_comments: number;          // Toplam yorum sayısı
  active_comments: number;         // Aktif yorum sayısı
  deleted_comments: number;        // Silinmiş yorum sayısı
  top_level_comments: number;      // Ana yorum sayısı
  reply_comments: number;          // Alt yorum sayısı
  comments_today: number;          // Bugünkü yorumlar
  comments_this_week: number;      // Bu haftaki yorumlar
  comments_this_month: number;     // Bu ayki yorumlar
}

/**
 * Bulk Moderation Result Interface
 * 
 * Toplu moderasyon işleminin sonucu.
 */
export interface BulkModerationResult {
  total_processed: number;         // İşlenen toplam öğe sayısı
  successful: number;              // Başarılı işlem sayısı
  failed: number;                  // Başarısız işlem sayısı
  results: ModerationItemResult[]; // Detaylı sonuçlar
}

/**
 * Moderation Item Result Interface
 * 
 * Tek bir moderasyon işleminin sonucu.
 */
export interface ModerationItemResult {
  comment_id: string;              // Yorum ID'si
  success: boolean;                // İşlem başarılı mı?
  error?: string;                  // Hata mesajı (varsa)
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Comment Service Response Interface
 * 
 * Tüm Comment servis metodlarının standart dönüş tipi.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface CommentServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== EXTENDED COMMENT TYPES ====================

/**
 * Comment with Permission Info Interface
 * 
 * Yorum + kullanıcı yetki bilgileri.
 */
export interface CommentWithPermissions extends CommentWithUser {
  can_edit: boolean;               // Düzenleyebilir mi?
  can_delete: boolean;             // Silebilir mi?
  can_reply: boolean;              // Yanıtlayabilir mi?
  reply_count?: number;            // Alt yorum sayısı
  replies?: CommentWithPermissions[]; // Alt yorumlar (recursive)
}

/**
 * Comment Tree Node Interface
 * 
 * Hiyerarşik yorum yapısı için node.
 */
export interface CommentTreeNode {
  comment: CommentWithUser;        // Yorum verisi
  children: CommentTreeNode[];     // Alt yorumlar
  depth: number;                   // Derinlik seviyesi
  parent_id: string | null;       // Ana yorum ID'si
}

// ==================== VALIDATION TYPES ====================

/**
 * Comment Validation Error Interface
 * 
 * Validasyon hatası detayları.
 */
export interface CommentValidationError {
  field: string;                   // Hatalı alan
  message: string;                 // Hata mesajı
  code?: string;                   // Hata kodu
}

/**
 * Comment Filter Options Interface
 * 
 * Yorum filtreleme seçenekleri.
 */
export interface CommentFilterOptions {
  user_id?: string;                // Kullanıcıya göre filtrele
  date_from?: string;              // Başlangıç tarihi
  date_to?: string;                // Bitiş tarihi
  is_deleted?: boolean;            // Silinmiş durumu
  has_replies?: boolean;           // Alt yorumu var mı?
  content_search?: string;         // İçerik araması
} 