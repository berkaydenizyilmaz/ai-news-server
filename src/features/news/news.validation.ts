/**
 * News Feature Validation Schemas
 * 
 * Zod kullanarak news modülü için validasyon şemaları.
 * Request DTO'ları için input validation sağlar.
 */

import { z } from 'zod';
import { 
  NEWS_QUERY_CONSTRAINTS, 
  CATEGORY_VALIDATION_RULES 
} from './news.constants';

// ==================== NEWS VALIDATION SCHEMAS ====================

/**
 * News Creation Validation Schema
 */
export const CreateNewsSchema = z.object({
  original_news_id: z
    .string()
    .uuid('Geçersiz orijinal haber ID\'si')
    .optional(),
    
  title: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.TITLE_MIN_LENGTH, 'Başlık çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.TITLE_MAX_LENGTH, 'Başlık çok uzun')
    .trim(),
  
  slug: z
    .string()
    .min(3, 'Slug çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.SLUG_MAX_LENGTH, 'Slug çok uzun')
    .optional(),
  
  content: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.CONTENT_MIN_LENGTH, 'İçerik çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.CONTENT_MAX_LENGTH, 'İçerik çok uzun')
    .trim(),
  
  summary: z
    .string()
    .max(NEWS_QUERY_CONSTRAINTS.SUMMARY_MAX_LENGTH, 'Özet çok uzun')
    .optional(),
  
  image_url: z
    .string()
    .url('Geçersiz resim URL\'i')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçersiz kategori ID\'si')
    .optional(),
    
  confidence_score: z
    .number()
    .min(0, 'Güven skoru 0\'dan küçük olamaz')
    .max(1, 'Güven skoru 1\'den büyük olamaz')
    .optional(),
    
  differences_analysis: z
    .string()
    .max(2000, 'Fark analizi çok uzun')
    .optional(),
});

/**
 * News Update Validation Schema
 */
export const UpdateNewsSchema = z.object({
  title: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.TITLE_MIN_LENGTH, 'Başlık çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.TITLE_MAX_LENGTH, 'Başlık çok uzun')
    .trim()
    .optional(),
  
  content: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.CONTENT_MIN_LENGTH, 'İçerik çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.CONTENT_MAX_LENGTH, 'İçerik çok uzun')
    .trim()
    .optional(),
  
  summary: z
    .string()
    .max(NEWS_QUERY_CONSTRAINTS.SUMMARY_MAX_LENGTH, 'Özet çok uzun')
    .optional(),
  
  image_url: z
    .string()
    .url('Geçersiz resim URL\'i')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçersiz kategori ID\'si')
    .optional(),
  
  confidence_score: z
    .number()
    .min(0, 'Güven skoru 0\'dan küçük olamaz')
    .max(1, 'Güven skoru 1\'den büyük olamaz')
    .optional(),
  
  differences_analysis: z
    .string()
    .max(2000, 'Fark analizi çok uzun')
    .optional(),
});

/**
 * News Query Validation Schema
 */
export const NewsQuerySchema = z.object({
  page: z
    .number()
    .int('Sayfa numarası tam sayı olmalıdır')
    .min(NEWS_QUERY_CONSTRAINTS.PAGE_MIN, 'Geçersiz sayfa numarası')
    .default(NEWS_QUERY_CONSTRAINTS.PAGE_DEFAULT),
  
  limit: z
    .number()
    .int('Limit tam sayı olmalıdır')
    .min(NEWS_QUERY_CONSTRAINTS.LIMIT_MIN, 'Limit çok küçük')
    .max(NEWS_QUERY_CONSTRAINTS.LIMIT_MAX, 'Limit çok büyük')
    .default(NEWS_QUERY_CONSTRAINTS.LIMIT_DEFAULT),
  
  search: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH, 'Arama terimi çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, 'Arama terimi çok uzun')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçersiz kategori ID\'si')
    .optional(),
  
  sort_by: z
    .enum(['created_at', 'updated_at', 'published_at', 'view_count'], {
      errorMap: () => ({ message: 'Geçersiz sıralama alanı' })
    })
    .default('created_at'),
  
  sort_order: z
    .enum(['asc', 'desc'], { errorMap: () => ({ message: 'Geçersiz sıralama yönü' }) })
    .default('desc'),
  
  date_from: z
    .string()
    .datetime('Geçersiz başlangıç tarihi formatı')
    .optional(),
  
  date_to: z
    .string()
    .datetime('Geçersiz bitiş tarihi formatı')
    .optional(),
});

// ==================== CATEGORY VALIDATION SCHEMAS ====================

/**
 * Category Creation Validation Schema
 */
export const CreateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(NEWS_QUERY_CONSTRAINTS.CATEGORY_NAME_MIN_LENGTH, 'Kategori adı çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.CATEGORY_NAME_MAX_LENGTH, 'Kategori adı çok uzun'),
  
  slug: z
    .string()
    .trim()
    .min(2, 'Slug çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.SLUG_MAX_LENGTH, 'Slug çok uzun')
    .regex(CATEGORY_VALIDATION_RULES.SLUG_PATTERN, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .refine(
      (slug) => !CATEGORY_VALIDATION_RULES.RESERVED_SLUGS.includes(slug as any),
      'Bu slug rezerve edilmiştir'
    ),
  
  description: z
    .string()
    .max(NEWS_QUERY_CONSTRAINTS.CATEGORY_DESCRIPTION_MAX_LENGTH, 'Açıklama çok uzun')
    .optional(),
  
  is_active: z
    .boolean()
    .default(true),
});

/**
 * Category Update Validation Schema
 */
export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(NEWS_QUERY_CONSTRAINTS.CATEGORY_NAME_MIN_LENGTH, 'Kategori adı çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.CATEGORY_NAME_MAX_LENGTH, 'Kategori adı çok uzun')
    .optional(),
  
  slug: z
    .string()
    .trim()
    .min(2, 'Slug çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.SLUG_MAX_LENGTH, 'Slug çok uzun')
    .regex(CATEGORY_VALIDATION_RULES.SLUG_PATTERN, 'Slug sadece küçük harf, rakam ve tire içerebilir')
    .refine(
      (slug) => !CATEGORY_VALIDATION_RULES.RESERVED_SLUGS.includes(slug as any),
      'Bu slug rezerve edilmiştir'
    )
    .optional(),
  
  description: z
    .string()
    .max(NEWS_QUERY_CONSTRAINTS.CATEGORY_DESCRIPTION_MAX_LENGTH, 'Açıklama çok uzun')
    .optional(),
  
  is_active: z
    .boolean()
    .optional(),
});

/**
 * Category Query Validation Schema
 */
export const CategoryQuerySchema = z.object({
  page: z
    .number()
    .int('Sayfa numarası tam sayı olmalıdır')
    .min(NEWS_QUERY_CONSTRAINTS.PAGE_MIN, 'Geçersiz sayfa numarası')
    .default(NEWS_QUERY_CONSTRAINTS.PAGE_DEFAULT),
  
  limit: z
    .number()
    .int('Limit tam sayı olmalıdır')
    .min(NEWS_QUERY_CONSTRAINTS.LIMIT_MIN, 'Limit çok küçük')
    .max(NEWS_QUERY_CONSTRAINTS.LIMIT_MAX, 'Limit çok büyük')
    .default(NEWS_QUERY_CONSTRAINTS.LIMIT_DEFAULT),
  
  search: z
    .string()
    .min(NEWS_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH, 'Arama terimi çok kısa')
    .max(NEWS_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, 'Arama terimi çok uzun')
    .optional(),
  
  is_active: z
    .boolean()
    .optional(),
  
  sort_by: z
    .enum(['name', 'created_at', 'updated_at'], {
      errorMap: () => ({ message: 'Geçersiz sıralama alanı' })
    })
    .default('name'),
  
  sort_order: z
    .enum(['asc', 'desc'], { errorMap: () => ({ message: 'Geçersiz sıralama yönü' }) })
    .default('asc'),
});

// ==================== NEWS GENERATION VALIDATION SCHEMAS ====================

/**
 * News Generation Request Validation Schema
 */
export const NewsGenerationSchema = z.object({
  original_news_id: z
    .string()
    .uuid('Geçersiz haber ID\'si'),
  
  available_categories: z
    .array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }))
    .min(1, 'En az bir kategori gereklidir'),
  
  max_sources: z
    .number()
    .int('Kaynak sayısı tam sayı olmalıdır')
    .min(1, 'En az 1 kaynak gereklidir')
    .max(15, 'Maksimum 15 kaynak kullanılabilir')
    .default(5),
  
  research_depth: z
    .enum(['quick', 'standard', 'deep'], { errorMap: () => ({ message: 'Geçersiz araştırma derinliği' }) })
    .default('standard'),
  
  force_regenerate: z
    .boolean()
    .default(false),
});

/**
 * Bulk Operation Validation Schema
 */
export const BulkNewsOperationSchema = z.object({
  news_ids: z
    .array(z.string().uuid('Geçersiz haber ID\'si'))
    .min(1, 'En az bir haber seçilmelidir')
    .max(50, 'Maksimum 50 haber seçilebilir'),
  
  operation: z
    .enum(['delete', 'update_category'], {
      errorMap: () => ({ message: 'Geçersiz işlem' })
    }),
  
  data: z.object({
    category_id: z
      .string()
      .uuid('Geçersiz kategori ID\'si')
      .optional(),
  }).optional(),
});

// ==================== EXPORT TYPES ====================

// Inferred types from schemas
export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;
export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
export type NewsQueryInput = z.infer<typeof NewsQuerySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof CategoryQuerySchema>;
export type NewsGenerationInput = z.infer<typeof NewsGenerationSchema>;
export type BulkNewsOperationInput = z.infer<typeof BulkNewsOperationSchema>; 