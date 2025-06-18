/**
 * Comments Feature Validation Schemas
 * 
 * Zod kullanarak Comments modülü için tüm validasyon şemalarını tanımlar.
 * Request body, query parameters ve URL parameters validasyonları.
 * 
 */

import { z } from 'zod';
import { COMMENT_CONTENT_CONSTRAINTS, COMMENT_QUERY_CONSTRAINTS, COMMENT_MODERATION_CONSTRAINTS } from './comments.constants';

// ==================== COMMENT VALIDATION SCHEMAS ====================

/**
 * Create Comment Schema
 * 
 * Yeni yorum oluşturma için validasyon.
 */
export const createCommentSchema = z.object({
  content: z.string()
    .min(COMMENT_CONTENT_CONSTRAINTS.MIN_LENGTH, {
      message: `Yorum en az ${COMMENT_CONTENT_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
    })
    .max(COMMENT_CONTENT_CONSTRAINTS.MAX_LENGTH, {
      message: `Yorum en fazla ${COMMENT_CONTENT_CONSTRAINTS.MAX_LENGTH} karakter olabilir`,
    })
    .trim(),
  processed_news_id: z.string().uuid({
    message: 'Geçerli bir haber ID\'si gereklidir',
  }),
  parent_id: z.string().uuid({
    message: 'Geçerli bir ana yorum ID\'si gereklidir',
  }).optional(),
});

/**
 * Update Comment Schema
 * 
 * Yorum güncelleme için validasyon.
 */
export const updateCommentSchema = z.object({
  content: z.string()
    .min(COMMENT_CONTENT_CONSTRAINTS.MIN_LENGTH, {
      message: `Yorum en az ${COMMENT_CONTENT_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`,
    })
    .max(COMMENT_CONTENT_CONSTRAINTS.MAX_LENGTH, {
      message: `Yorum en fazla ${COMMENT_CONTENT_CONSTRAINTS.MAX_LENGTH} karakter olabilir`,
    })
    .trim(),
});

/**
 * Comment ID Schema
 * 
 * URL parametresi olarak gelen comment ID validasyonu.
 */
export const commentIdSchema = z.object({
  id: z.string().uuid({
    message: 'Geçerli bir yorum ID\'si gereklidir',
  }),
});

/**
 * Comment Query Schema
 * 
 * Yorum listesi için query parameters validasyonu.
 */
export const commentQuerySchema = z.object({
  processed_news_id: z.string().uuid({
    message: 'Geçerli bir haber ID\'si gereklidir',
  }),
  page: z.coerce.number()
    .int()
    .min(COMMENT_QUERY_CONSTRAINTS.PAGE_MIN)
    .default(COMMENT_QUERY_CONSTRAINTS.PAGE_DEFAULT),
  limit: z.coerce.number()
    .int()
    .min(COMMENT_QUERY_CONSTRAINTS.LIMIT_MIN)
    .max(COMMENT_QUERY_CONSTRAINTS.LIMIT_MAX)
    .default(COMMENT_QUERY_CONSTRAINTS.LIMIT_DEFAULT),
  sort_by: z.enum(['created_at', 'updated_at'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc'])
    .default('desc'),
  include_deleted: z.coerce.boolean()
    .default(false),
});

/**
 * Bulk Moderation Schema
 * 
 * Toplu moderasyon işlemi için validasyon.
 */
export const bulkModerationSchema = z.object({
  comment_ids: z.array(z.string().uuid({
    message: 'Geçerli yorum ID\'leri gereklidir',
  }))
    .min(1, {
      message: 'En az bir yorum ID\'si gereklidir',
    })
    .max(COMMENT_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS, {
      message: `En fazla ${COMMENT_MODERATION_CONSTRAINTS.MAX_BULK_OPERATIONS} yorum seçilebilir`,
    }),
  action: z.enum(['delete', 'restore'], {
    errorMap: () => ({ message: 'Geçerli bir işlem türü seçiniz (delete, restore)' }),
  }),
  reason: z.string()
    .max(COMMENT_MODERATION_CONSTRAINTS.REASON_MAX_LENGTH, {
      message: `Açıklama en fazla ${COMMENT_MODERATION_CONSTRAINTS.REASON_MAX_LENGTH} karakter olabilir`,
    })
    .optional(),
});

// ==================== TYPE EXPORTS ====================

/**
 * TypeScript Types from Zod Schemas
 * 
 * Zod şemalarından otomatik tip çıkarımı.
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentIdInput = z.infer<typeof commentIdSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type BulkModerationInput = z.infer<typeof bulkModerationSchema>; 