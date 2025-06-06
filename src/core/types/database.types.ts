/**
 * Database Types Module
 * 
 * Supabase veritabanı şemasına göre oluşturulmuş tip tanımlamaları.
 * Tüm veritabanı işlemlerinde bu tipler kullanılır.
 */

// ==================== TYPE DEFINITIONS ====================

/**
 * User Role Type
 * Kullanıcı rol tipleri
 */
export type UserRole = 'visitor' | 'user' | 'moderator' | 'admin';

/**
 * News Status Type
 * Haber durumu tipleri
 */
export type NewsStatus = 'pending' | 'processing' | 'published' | 'rejected';

/**
 * Forum Status Type
 * Forum konusu durumu tipleri
 */
export type ForumStatus = 'active' | 'locked' | 'deleted';

/**
 * Entity Type
 * Forum like entity tipleri
 */
export type EntityType = 'forum_post' | 'forum_topic';

/**
 * Report Status Type
 * Şikayet durumu tipleri
 */
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

/**
 * Reported Content Type
 * Şikayet edilen içerik tipleri
 */
export type ReportedType = 'news' | 'comment' | 'forum_post';

/**
 * Notification Type
 * Bildirim tipleri
 */
export type NotificationType = 'comment_reply' | 'forum_reply' | 'forum_mention' | 'news_published' | 'system';

/**
 * Related Content Type
 * İlişkili içerik tipleri
 */
export type RelatedType = 'comment' | 'forum_post' | 'news' | 'forum_topic';

/**
 * Log Level Type
 * Log seviyesi tipleri
 */
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

/**
 * Setting Value Type
 * Ayar değeri tipleri
 */
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

/**
 * Statistic Period Type
 * İstatistik periyod tipleri
 */
export type StatisticPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

/**
 * Setting Category Type
 * Ayar kategorisi tipleri
 */
export type SettingCategory = 'rss' | 'ai' | 'general' | 'auth' | 'news' | 'forum';

/**
 * Statistic Category Type
 * İstatistik kategori tipleri
 */
export type StatisticCategory = 'user' | 'news' | 'forum' | 'ai';

// ==================== INTERFACE DEFINITIONS ====================

/**
 * User Interface
 * Kullanıcı bilgilerini tanımlar
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Setting Interface
 * Sistem ayarlarını tanımlar
 */
export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  description?: string;
  category?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * News Category Interface
 * Haber kategorilerini tanımlar
 */
export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * RSS Source Interface
 * RSS kaynaklarını tanımlar
 */
export interface RssSource {
  id: string;
  name: string;
  url: string;
  description?: string;
  category_id?: string;
  is_active: boolean;
  last_fetched_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Original News Interface
 * RSS'den çekilen orijinal haberleri tanımlar
 */
export interface OriginalNews {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  original_url: string;
  image_url?: string;
  author?: string;
  published_date?: string;
  rss_source_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Processed News Interface
 * AI tarafından işlenmiş haberleri tanımlar
 */
export interface ProcessedNews {
  id: string;
  original_news_id?: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  image_url?: string;
  category_id?: string;
  status: NewsStatus;
  confidence_score?: number;
  differences_analysis?: string;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * News Source Interface
 * Haber kaynaklarını tanımlar
 */
export interface NewsSource {
  id: string;
  processed_news_id: string;
  source_name: string;
  source_url: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * News Difference Interface
 * Orijinal ve işlenmiş haber arasındaki farkları tanımlar
 */
export interface NewsDifference {
  id: string;
  news_id: string;
  title: string;
  description: string;
  created_at: string;
}

/**
 * Comment Interface
 * Haber yorumlarını tanımlar
 */
export interface Comment {
  id: string;
  processed_news_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Forum Category Interface
 * Forum kategorilerini tanımlar
 */
export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Forum Topic Interface
 * Forum konularını tanımlar
 */
export interface ForumTopic {
  id: string;
  category_id?: string;
  user_id?: string;
  title: string;
  slug: string;
  content: string;
  status: ForumStatus;
  is_pinned: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  dislike_count: number;
  last_reply_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Forum Post Interface
 * Forum mesajlarını tanımlar
 */
export interface ForumPost {
  id: string;
  topic_id: string;
  user_id?: string;
  content: string;
  is_deleted: boolean;
  like_count: number;
  dislike_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Forum News Quote Interface
 * Forum mesajlarındaki haber alıntılarını tanımlar
 */
export interface ForumNewsQuote {
  id: string;
  post_id: string;
  processed_news_id?: string;
  quoted_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Notification Interface
 * Kullanıcı bildirimlerini tanımlar
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  related_type?: RelatedType;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Log Interface
 * Sistem loglarını tanımlar
 */
export interface Log {
  id: string;
  level: LogLevel;
  message: string;
  module?: string;
  action?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Report Interface
 * İçerik şikayetlerini tanımlar
 */
export interface Report {
  id: string;
  reporter_id?: string;
  reported_type: ReportedType;
  reported_id: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Forum Like Interface
 * Forum beğeni/beğenmeme kayıtlarını tanımlar
 */
export interface ForumLike {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  is_like: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Platform Statistic Interface
 * Platform istatistiklerini tanımlar
 */
export interface PlatformStatistic {
  id: string;
  period: StatisticPeriod;
  date: string;
  category: StatisticCategory;
  metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
} 

// ==================== EXTENDED INTERFACES ====================

/**
 * Processed News with Details Interface
 * İşlenmiş haberi tüm ilişkili verileriyle birlikte tanımlar
 */
export interface ProcessedNewsWithDetails extends ProcessedNews {
  original_news?: OriginalNews;
  category?: NewsCategory;
  rss_source?: RssSource;
  sources?: NewsSource[];
  comments?: Comment[];
}

/**
 * Original News with Source Interface
 * Orijinal haberi RSS kaynağıyla birlikte tanımlar
 */
export interface OriginalNewsWithSource extends OriginalNews {
  rss_source?: RssSource;
}

/**
 * RSS Source with Category Interface
 * RSS kaynağını kategorisiyle birlikte tanımlar
 */
export interface RssSourceWithCategory extends RssSource {
  category?: NewsCategory;
}

/**
 * Comment with User Interface
 * Yorumu kullanıcı bilgisi ve alt yorumlarıyla birlikte tanımlar
 */
export interface CommentWithUser extends Comment {
  user?: User;
  replies?: CommentWithUser[];
}

/**
 * Forum Topic with Details Interface
 * Forum konusunu tüm ilişkili verileriyle birlikte tanımlar
 */
export interface ForumTopicWithDetails extends ForumTopic {
  category?: ForumCategory;
  user?: User;
  posts?: ForumPost[];
  likes?: ForumLike[];
}

/**
 * Forum Post with User Interface
 * Forum mesajını kullanıcı bilgisi ve alıntılarıyla birlikte tanımlar
 */
export interface ForumPostWithUser extends ForumPost {
  user?: User;
  quotes?: ForumNewsQuote[];
  likes?: ForumLike[];
}

/**
 * User with Stats Interface
 * Kullanıcıyı istatistikleriyle birlikte tanımlar
 */
export interface UserWithStats extends User {
  comment_count?: number;
  forum_post_count?: number;
  unread_notifications?: number;
}

/**
 * Log with User Interface
 * Log kaydını kullanıcı bilgisiyle birlikte tanımlar
 */
export interface LogWithUser extends Log {
  user?: User;
}

/**
 * Setting with User Interface
 * Ayarı güncelleyen kullanıcı bilgisiyle birlikte tanımlar
 */
export interface SettingWithUser extends Setting {
  updated_by_user?: User;
}