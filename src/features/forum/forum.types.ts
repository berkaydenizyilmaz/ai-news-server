/**
 * Forum Feature Type Definitions
 * 
 * Forum modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve forum yapıları.
 * 
 */

import { ForumCategory, ForumTopic, ForumPost, ForumLike, ForumNewsQuote } from '@/core/types/database.types';

// ==================== FORUM REQUEST DTOs ====================

/**
 * Forum Category Creation Request DTO
 * 
 * Yeni forum kategorisi oluşturma için gerekli veriler.
 */
export interface CreateForumCategoryRequest {
  name: string;                     // Kategori adı
  description?: string;            // Kategori açıklaması
  slug: string;                    // URL slug
}

/**
 * Forum Category Update Request DTO
 * 
 * Mevcut forum kategorisini güncelleme için gerekli veriler.
 */
export interface UpdateForumCategoryRequest {
  name?: string;                   // Kategori adı
  description?: string;            // Kategori açıklaması
  slug?: string;                   // URL slug
  is_active?: boolean;             // Aktif/pasif durumu
}

/**
 * Forum Topic Creation Request DTO
 * 
 * Yeni forum konusu oluşturma için gerekli veriler.
 */
export interface CreateForumTopicRequest {
  category_id: string;             // Kategori ID'si
  title: string;                   // Konu başlığı
  content: string;                 // Konu içeriği
}

/**
 * Forum Topic Update Request DTO
 * 
 * Mevcut forum konusunu güncelleme için gerekli veriler.
 */
export interface UpdateForumTopicRequest {
  title?: string;                  // Konu başlığı
  content?: string;                // Konu içeriği
  category_id?: string;            // Kategori ID'si
  slug?: string;                   // URL slug (otomatik oluşturulur)
}

/**
 * Forum Post Creation Request DTO
 * 
 * Yeni forum gönderisi oluşturma için gerekli veriler.
 */
export interface CreateForumPostRequest {
  topic_id: string;                // Konu ID'si
  content: string;                 // Gönderi içeriği
}

/**
 * Forum Post Update Request DTO
 * 
 * Mevcut forum gönderisini güncelleme için gerekli veriler.
 */
export interface UpdateForumPostRequest {
  content: string;                 // Gönderi içeriği
}

/**
 * Forum Like Request DTO
 * 
 * Beğeni/beğenmeme işlemi için gerekli veriler.
 */
export interface ForumLikeRequest {
  entity_type: 'forum_topic' | 'forum_post';  // Beğenilen içerik tipi
  entity_id: string;               // Beğenilen içerik ID'si
  is_like: boolean;                // true: beğeni, false: beğenmeme
}

/**
 * Forum Query Request DTO
 * 
 * Forum listesi için filtreleme ve sayfalama parametreleri.
 */
export interface ForumQueryRequest {
  category_id?: string;            // Kategori ID'si
  page?: number;                   // Sayfa numarası
  limit?: number;                  // Sayfa başına öğe sayısı
  sort_by?: string;               // Sıralama alanı
  sort_order?: 'asc' | 'desc';    // Sıralama yönü
  search?: string;                // Arama terimi
  status?: string;                // Forum durumu
  is_pinned?: boolean;            // Sabitlenmiş konular
}

/**
 * Bulk Moderation Request DTO
 * 
 * Toplu moderasyon işlemi için gerekli veriler.
 */
export interface BulkModerationRequest {
  entity_ids: string[];           // İşlem yapılacak öğe ID'leri
  entity_type: 'topic' | 'post'; // İşlem yapılacak öğe tipi
  action: 'delete' | 'restore' | 'lock' | 'unlock' | 'pin' | 'unpin'; // Yapılacak işlem
  reason?: string;                // Moderasyon sebebi (opsiyonel)
}

// ==================== FORUM RESPONSE DTOs ====================

/**
 * Forum Statistics Interface
 * 
 * Forum istatistikleri.
 */
export interface ForumStatistics {
  total_categories: number;        // Toplam kategori sayısı
  total_topics: number;           // Toplam konu sayısı
  total_posts: number;            // Toplam gönderi sayısı
  active_topics: number;          // Aktif konu sayısı
  locked_topics: number;          // Kilitli konu sayısı
  deleted_topics: number;         // Silinmiş konu sayısı
  topics_today: number;           // Bugünkü konular
  topics_this_week: number;       // Bu haftaki konular
  topics_this_month: number;      // Bu ayki konular
  posts_today: number;            // Bugünkü gönderiler
  posts_this_week: number;        // Bu haftaki gönderiler
  posts_this_month: number;       // Bu ayki gönderiler
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
  entity_id: string;               // Öğe ID'si
  success: boolean;                // İşlem başarılı mı?
  error?: string;                  // Hata mesajı (varsa)
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Forum Service Response Interface
 * 
 * Tüm Forum servis metodlarının standart dönüş tipi.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface ForumServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== EXTENDED FORUM TYPES ====================

/**
 * Forum Category with Statistics Interface
 * 
 * Kategori + istatistik bilgileri.
 */
export interface ForumCategoryWithStats extends ForumCategory {
  topic_count: number;             // Kategori altındaki konu sayısı
  post_count: number;              // Kategori altındaki gönderi sayısı
  latest_topic?: ForumTopic;       // Son konu
  latest_post?: ForumPost;         // Son gönderi
}

/**
 * Forum Topic with Details Interface
 * 
 * Konu + detay bilgileri.
 */
export interface ForumTopicWithDetails extends ForumTopic {
  category?: ForumCategory;        // Kategori bilgisi
  user?: {                        // Kullanıcı bilgisi
    id: string;
    username: string;
    avatar_url?: string;
    role: string;
  };
  posts?: ForumPostWithUser[];     // Konu altındaki gönderiler
  likes?: ForumLike[];            // Beğeniler
  user_like?: ForumLike;          // Kullanıcının beğenisi
  can_edit?: boolean;             // Düzenleyebilir mi?
  can_delete?: boolean;           // Silebilir mi?
  can_pin?: boolean;              // Sabitleyebilir mi?
  can_lock?: boolean;             // Kilitleyebilir mi?
}

/**
 * Forum Post with User Interface
 * 
 * Gönderi + kullanıcı bilgileri.
 */
export interface ForumPostWithUser extends ForumPost {
  user?: {                        // Kullanıcı bilgisi
    id: string;
    username: string;
    avatar_url?: string;
    role: string;
  };
  topic?: ForumTopic;             // Konu bilgisi
  quotes?: ForumNewsQuote[];      // Haber alıntıları
  likes?: ForumLike[];            // Beğeniler
  user_like?: ForumLike;          // Kullanıcının beğenisi
  can_edit?: boolean;             // Düzenleyebilir mi?
  can_delete?: boolean;           // Silebilir mi?
}

/**
 * Forum Topic List Item Interface
 * 
 * Konu listesi için optimize edilmiş tip.
 */
export interface ForumTopicListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_pinned: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  dislike_count: number;
  last_reply_at?: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  latest_post?: {
    id: string;
    user?: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    created_at: string;
  };
}

// ==================== VALIDATION TYPES ====================

/**
 * Forum Validation Error Interface
 * 
 * Validasyon hatası detayları.
 */
export interface ForumValidationError {
  field: string;                   // Hatalı alan
  message: string;                 // Hata mesajı
  code?: string;                   // Hata kodu
}

/**
 * Forum Filter Options Interface
 * 
 * Forum filtreleme seçenekleri.
 */
export interface ForumFilterOptions {
  category_id?: string;            // Kategoriye göre filtrele
  user_id?: string;                // Kullanıcıya göre filtrele
  date_from?: string;              // Başlangıç tarihi
  date_to?: string;                // Bitiş tarihi
  status?: string;                 // Duruma göre filtrele
  is_pinned?: boolean;            // Sabitlenmiş konular
  has_replies?: boolean;           // Yanıtı olan konular
  content_search?: string;         // İçerik araması
} 