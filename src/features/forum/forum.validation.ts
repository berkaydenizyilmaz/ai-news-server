/**
 * Forum Feature Validation Schemas
 * 
 * Forum modülü için Zod ile oluşturulmuş validasyon şemaları.
 * Tüm giriş verilerinin doğrulanması için kullanılır.
 */

import { z } from 'zod';
import { 
  FORUM_TOPIC_CONSTRAINTS, 
  FORUM_POST_CONSTRAINTS, 
  FORUM_CATEGORY_CONSTRAINTS,
  FORUM_QUERY_CONSTRAINTS,
  FORUM_MODERATION_CONSTRAINTS
} from './forum.constants';

// ==================== FORUM CATEGORY VALIDATION ====================

/**
 * Forum Category Creation Validation Schema
 * 
 * Yeni forum kategorisi oluşturma için validasyon.
 */
export const createForumCategorySchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/),
});

/**
 * Forum Category Update Validation Schema
 * 
 * Mevcut forum kategorisini güncelleme için validasyon.
 */
export const updateForumCategorySchema = z.object({
  name: z
    .string()
    .min(FORUM_CATEGORY_CONSTRAINTS.NAME_MIN_LENGTH, `Kategori adı en az ${FORUM_CATEGORY_CONSTRAINTS.NAME_MIN_LENGTH} karakter olmalıdır`)
    .max(FORUM_CATEGORY_CONSTRAINTS.NAME_MAX_LENGTH, `Kategori adı en fazla ${FORUM_CATEGORY_CONSTRAINTS.NAME_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(FORUM_CATEGORY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH, `Açıklama en fazla ${FORUM_CATEGORY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} karakter olabilir`)
    .optional(),
  
  slug: z
    .string()
    .min(1, 'Slug gereklidir')
    .max(FORUM_CATEGORY_CONSTRAINTS.SLUG_MAX_LENGTH, `Slug en fazla ${FORUM_CATEGORY_CONSTRAINTS.SLUG_MAX_LENGTH} karakter olabilir`)
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .trim()
    .optional(),
  
  is_active: z.boolean().optional(),
});

// ==================== FORUM TOPIC VALIDATION ====================

/**
 * Forum Topic Creation Validation Schema
 * 
 * Yeni forum konusu oluşturma için validasyon.
 */
export const createForumTopicSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(5).max(500),
  content: z.string().min(10).max(10000),
});

/**
 * Forum Topic Update Validation Schema
 * 
 * Mevcut forum konusunu güncelleme için validasyon.
 */
export const updateForumTopicSchema = z.object({
  title: z
    .string()
    .min(FORUM_TOPIC_CONSTRAINTS.TITLE_MIN_LENGTH, `Başlık en az ${FORUM_TOPIC_CONSTRAINTS.TITLE_MIN_LENGTH} karakter olmalıdır`)
    .max(FORUM_TOPIC_CONSTRAINTS.TITLE_MAX_LENGTH, `Başlık en fazla ${FORUM_TOPIC_CONSTRAINTS.TITLE_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  content: z
    .string()
    .min(FORUM_TOPIC_CONSTRAINTS.CONTENT_MIN_LENGTH, `İçerik en az ${FORUM_TOPIC_CONSTRAINTS.CONTENT_MIN_LENGTH} karakter olmalıdır`)
    .max(FORUM_TOPIC_CONSTRAINTS.CONTENT_MAX_LENGTH, `İçerik en fazla ${FORUM_TOPIC_CONSTRAINTS.CONTENT_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçerli bir kategori ID\'si gereklidir')
    .optional(),
});

// ==================== FORUM POST VALIDATION ====================

/**
 * Forum Post Creation Validation Schema
 * 
 * Yeni forum gönderisi oluşturma için validasyon.
 */
export const createForumPostSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().min(3).max(5000),
});

/**
 * Forum Post Update Validation Schema
 * 
 * Mevcut forum gönderisini güncelleme için validasyon.
 */
export const updateForumPostSchema = z.object({
  content: z
    .string()
    .min(FORUM_POST_CONSTRAINTS.CONTENT_MIN_LENGTH, `İçerik en az ${FORUM_POST_CONSTRAINTS.CONTENT_MIN_LENGTH} karakter olmalıdır`)
    .max(FORUM_POST_CONSTRAINTS.CONTENT_MAX_LENGTH, `İçerik en fazla ${FORUM_POST_CONSTRAINTS.CONTENT_MAX_LENGTH} karakter olabilir`)
    .trim(),
});

// ==================== FORUM LIKE VALIDATION ====================

/**
 * Forum Like Validation Schema
 * 
 * Beğeni/beğenmeme işlemi için validasyon.
 */
export const forumLikeSchema = z.object({
  entity_type: z
    .enum(['forum_topic', 'forum_post'], {
      errorMap: () => ({ message: 'Geçerli bir entity type gereklidir' })
    }),
  
  entity_id: z
    .string()
    .uuid('Geçerli bir entity ID gereklidir'),
  
  is_like: z
    .boolean({
      errorMap: () => ({ message: 'Beğeni durumu true veya false olmalıdır' })
    }),
});

// ==================== FORUM QUERY VALIDATION ====================

/**
 * Forum Query Validation Schema
 * 
 * Forum listesi sorguları için validasyon.
 */
export const forumQuerySchema = z.object({
  category_id: z
    .string()
    .uuid('Geçerli bir kategori ID\'si gereklidir')
    .optional(),
  
  page: z
    .number()
    .int()
    .min(FORUM_QUERY_CONSTRAINTS.PAGE_MIN, `Sayfa numarası en az ${FORUM_QUERY_CONSTRAINTS.PAGE_MIN} olmalıdır`)
    .default(FORUM_QUERY_CONSTRAINTS.PAGE_DEFAULT),
  
  limit: z
    .number()
    .int()
    .min(FORUM_QUERY_CONSTRAINTS.LIMIT_MIN, `Limit en az ${FORUM_QUERY_CONSTRAINTS.LIMIT_MIN} olmalıdır`)
    .max(FORUM_QUERY_CONSTRAINTS.LIMIT_MAX, `Limit en fazla ${FORUM_QUERY_CONSTRAINTS.LIMIT_MAX} olabilir`)
    .default(FORUM_QUERY_CONSTRAINTS.LIMIT_DEFAULT),
  
  sort_by: z
    .enum(['created_at', 'updated_at', 'title', 'view_count', 'reply_count', 'like_count', 'last_reply_at'])
    .default('created_at')
    .optional(),
  
  sort_order: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional(),
  
  search: z
    .string()
    .min(FORUM_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH, `Arama terimi en az ${FORUM_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH} karakter olmalıdır`)
    .max(FORUM_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, `Arama terimi en fazla ${FORUM_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  status: z
    .enum(['active', 'locked', 'deleted'])
    .optional(),
  
  is_pinned: z
    .boolean()
    .optional(),
});

// ==================== MODERATION VALIDATION ====================

/**
 * Bulk Moderation Validation Schema
 * 
 * Toplu moderasyon işlemi için validasyon.
 */
export const bulkModerationSchema = z.object({
  entity_ids: z
    .array(z.string().uuid('Geçerli UUID gereklidir'))
    .min(1, 'En az bir öğe seçilmelidir')
    .max(FORUM_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS, `En fazla ${FORUM_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS} öğe seçilebilir`),
  
  entity_type: z
    .enum(['topic', 'post'], {
      errorMap: () => ({ message: 'Geçerli bir entity type gereklidir' })
    }),
  
  action: z
    .enum(['delete', 'restore', 'lock', 'unlock', 'pin', 'unpin'], {
      errorMap: () => ({ message: 'Geçerli bir moderasyon işlemi gereklidir' })
    }),
  
  reason: z
    .string()
    .max(FORUM_MODERATION_CONSTRAINTS.REASON_MAX_LENGTH, `Sebep en fazla ${FORUM_MODERATION_CONSTRAINTS.REASON_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
});

// ==================== ID VALIDATION ====================

/**
 * UUID Parameter Validation Schema
 * 
 * URL parametrelerinde UUID doğrulaması için.
 */
export const uuidParamSchema = z.object({
  id: z
    .string()
    .uuid('Geçerli bir ID gereklidir'),
});

/**
 * Slug Parameter Validation Schema
 * 
 * URL parametrelerinde slug doğrulaması için.
 */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug gereklidir')
    .regex(/^[a-z0-9-]+$/, 'Geçerli bir slug formatı gereklidir'),
});

// ==================== TYPE EXPORTS ====================

/**
 * Inferred Types from Zod Schemas
 * 
 * Zod şemalarından çıkarılan TypeScript tipleri.
 */
export type CreateForumCategoryData = z.infer<typeof createForumCategorySchema>;
export type UpdateForumCategoryData = z.infer<typeof updateForumCategorySchema>;
export type CreateForumTopicData = z.infer<typeof createForumTopicSchema>;
export type UpdateForumTopicData = z.infer<typeof updateForumTopicSchema>;
export type CreateForumPostData = z.infer<typeof createForumPostSchema>;
export type UpdateForumPostData = z.infer<typeof updateForumPostSchema>;
export type ForumLikeData = z.infer<typeof forumLikeSchema>;
export type ForumQueryData = z.infer<typeof forumQuerySchema>;
export type BulkModerationData = z.infer<typeof bulkModerationSchema>;
export type UuidParamData = z.infer<typeof uuidParamSchema>;
export type SlugParamData = z.infer<typeof slugParamSchema>; 