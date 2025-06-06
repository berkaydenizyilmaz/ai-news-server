/**
 * RSS Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';

// ==================== VALIDATION CONSTANTS ====================

// RSS kaynak adı için minimum/maksimum değerler
const RSS_NAME_MIN_LENGTH = 3;
const RSS_NAME_MAX_LENGTH = 255;

// URL validasyonu için regex pattern
const URL_REGEX = /^https?:\/\/.+/;

// ==================== VALIDATION SCHEMAS ====================

/**
 * RSS Source Creation Validation Schema
 * 
 * Yeni RSS kaynağı oluşturma için validasyon kuralları:
 * - Name: 3-255 karakter, zorunlu
 * - URL: Geçerli HTTP/HTTPS URL, zorunlu
 * - Description: Opsiyonel string
 * - Category ID: Opsiyonel UUID
 */
export const createRssSourceSchema = z.object({
  name: z
    .string()
    .min(RSS_NAME_MIN_LENGTH, `RSS kaynak adı en az ${RSS_NAME_MIN_LENGTH} karakter olmalıdır`)
    .max(RSS_NAME_MAX_LENGTH, `RSS kaynak adı en fazla ${RSS_NAME_MAX_LENGTH} karakter olmalıdır`)
    .min(1, 'RSS kaynak adı zorunludur'),
  
  url: z
    .string()
    .regex(URL_REGEX, 'Geçerli bir HTTP/HTTPS URL giriniz')
    .min(1, 'RSS URL zorunludur'),
  
  description: z
    .string()
    .max(1000, 'Açıklama en fazla 1000 karakter olmalıdır')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçerli bir kategori ID giriniz')
    .optional(),
});

/**
 * RSS Source Update Validation Schema
 * 
 * Mevcut RSS kaynağını güncelleme için validasyon kuralları:
 * - Tüm alanlar opsiyonel (partial update)
 * - Verilen alanlar için aynı kurallar geçerli
 */
export const updateRssSourceSchema = z.object({
  name: z
    .string()
    .min(RSS_NAME_MIN_LENGTH, `RSS kaynak adı en az ${RSS_NAME_MIN_LENGTH} karakter olmalıdır`)
    .max(RSS_NAME_MAX_LENGTH, `RSS kaynak adı en fazla ${RSS_NAME_MAX_LENGTH} karakter olmalıdır`)
    .optional(),
  
  url: z
    .string()
    .regex(URL_REGEX, 'Geçerli bir HTTP/HTTPS URL giriniz')
    .optional(),
  
  description: z
    .string()
    .max(1000, 'Açıklama en fazla 1000 karakter olmalıdır')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Geçerli bir kategori ID giriniz')
    .nullable()
    .optional(),
  
  is_active: z
    .boolean()
    .optional(),
});

/**
 * RSS Fetch Request Validation Schema
 * 
 * RSS çekme işlemi için validasyon kuralları:
 * - Source ID: Opsiyonel UUID
 * - Max Items: 1-100 arası sayı
 * - Force Refresh: Boolean
 */
export const rssFetchSchema = z.object({
  source_id: z
    .string()
    .uuid('Geçerli bir kaynak ID giriniz')
    .optional(),
  
  max_items: z
    .number()
    .int('Maksimum öğe sayısı tam sayı olmalıdır')
    .min(1, 'Maksimum öğe sayısı en az 1 olmalıdır')
    .max(100, 'Maksimum öğe sayısı en fazla 100 olmalıdır')
    .optional(),
  
  force_refresh: z
    .boolean()
    .optional(),
});

/**
 * RSS Source ID Validation Schema
 * 
 * URL parametrelerinden gelen RSS kaynak ID'si için validasyon.
 */
export const rssSourceIdSchema = z.object({
  id: z
    .string()
    .uuid('Geçerli bir RSS kaynak ID giriniz'),
});

/**
 * RSS Source Query Parameters Validation Schema
 * 
 * RSS kaynak listesi için query parametreleri validasyonu:
 * - Page: Sayfa numarası
 * - Limit: Sayfa başına öğe sayısı
 * - Category ID: Kategori filtresi
 * - Active: Aktif/pasif filtresi
 * - Search: Arama terimi
 */
export const rssSourceQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Sayfa numarası geçerli bir sayı olmalıdır')
    .transform(Number)
    .refine(val => val >= 1, 'Sayfa numarası en az 1 olmalıdır')
    .optional()
    .default('1'),
  
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit geçerli bir sayı olmalıdır')
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, 'Limit 1-100 arasında olmalıdır')
    .optional()
    .default('10'),
  
  category_id: z
    .string()
    .uuid('Geçerli bir kategori ID giriniz')
    .optional(),
  
  is_active: z
    .string()
    .regex(/^(true|false)$/, 'Aktif durumu true veya false olmalıdır')
    .transform(val => val === 'true')
    .optional(),
  
  search: z
    .string()
    .min(2, 'Arama terimi en az 2 karakter olmalıdır')
    .max(100, 'Arama terimi en fazla 100 karakter olmalıdır')
    .optional(),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type CreateRssSourceInput = z.infer<typeof createRssSourceSchema>;
export type UpdateRssSourceInput = z.infer<typeof updateRssSourceSchema>;
export type RssFetchInput = z.infer<typeof rssFetchSchema>;
export type RssSourceIdInput = z.infer<typeof rssSourceIdSchema>;
export type RssSourceQueryInput = z.infer<typeof rssSourceQuerySchema>; 