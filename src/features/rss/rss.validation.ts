/**
 * RSS Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';
import { 
  RSS_NAME_CONSTRAINTS,
  RSS_DESCRIPTION_CONSTRAINTS,
  RSS_URL_VALIDATION,
  RSS_FETCH_CONSTRAINTS,
  RSS_QUERY_CONSTRAINTS,
  RSS_VALIDATION_MESSAGES
} from './rss.constants';

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
 */
export const createRssSourceSchema = z.object({
  name: z
    .string()
    .min(RSS_NAME_CONSTRAINTS.MIN_LENGTH, RSS_VALIDATION_MESSAGES.NAME_MIN_LENGTH)
    .max(RSS_NAME_CONSTRAINTS.MAX_LENGTH, RSS_VALIDATION_MESSAGES.NAME_MAX_LENGTH)
    .min(1, RSS_VALIDATION_MESSAGES.NAME_REQUIRED),
  
  url: z
    .string()
    .regex(RSS_URL_VALIDATION.REGEX, RSS_VALIDATION_MESSAGES.URL_INVALID)
    .min(1, RSS_VALIDATION_MESSAGES.URL_REQUIRED),
  
  description: z
    .string()
    .max(RSS_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, RSS_VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH)
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
    .min(RSS_NAME_CONSTRAINTS.MIN_LENGTH, RSS_VALIDATION_MESSAGES.NAME_MIN_LENGTH)
    .max(RSS_NAME_CONSTRAINTS.MAX_LENGTH, RSS_VALIDATION_MESSAGES.NAME_MAX_LENGTH)
    .optional(),
  
  url: z
    .string()
    .regex(RSS_URL_VALIDATION.REGEX, RSS_VALIDATION_MESSAGES.URL_INVALID)
    .optional(),
  
  description: z
    .string()
    .max(RSS_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, RSS_VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH)
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
    .uuid(RSS_VALIDATION_MESSAGES.UUID_INVALID)
    .optional(),
  
  max_items: z
    .number()
    .int(RSS_VALIDATION_MESSAGES.MAX_ITEMS_INVALID)
    .min(RSS_FETCH_CONSTRAINTS.MAX_ITEMS_MIN, RSS_VALIDATION_MESSAGES.MAX_ITEMS_MIN)
    .max(RSS_FETCH_CONSTRAINTS.MAX_ITEMS_MAX, RSS_VALIDATION_MESSAGES.MAX_ITEMS_MAX)
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
    .uuid(RSS_VALIDATION_MESSAGES.SOURCE_ID_INVALID),
});

/**
 * RSS Source Query Parameters Validation Schema
 * 
 * RSS kaynak listesi için query parametreleri validasyonu:
 * - Page: Sayfa numarası
 * - Limit: Sayfa başına öğe sayısı
 * - Active: Aktif/pasif filtresi
 * - Search: Arama terimi
 */
export const rssSourceQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, RSS_VALIDATION_MESSAGES.PAGE_INVALID)
    .transform(Number)
    .refine(val => val >= RSS_QUERY_CONSTRAINTS.PAGE_MIN, RSS_VALIDATION_MESSAGES.PAGE_MIN)
    .optional()
    .default('1'),
  
  limit: z
    .string()
    .regex(/^\d+$/, RSS_VALIDATION_MESSAGES.LIMIT_INVALID)
    .transform(Number)
    .refine(val => val >= RSS_QUERY_CONSTRAINTS.LIMIT_MIN && val <= RSS_QUERY_CONSTRAINTS.LIMIT_MAX, RSS_VALIDATION_MESSAGES.LIMIT_RANGE)
    .optional()
    .default(RSS_QUERY_CONSTRAINTS.LIMIT_DEFAULT.toString()),
  
  is_active: z
    .string()
    .regex(/^(true|false)$/, RSS_VALIDATION_MESSAGES.ACTIVE_STATUS_INVALID)
    .transform(val => val === 'true')
    .optional(),
  
  search: z
    .string()
    .min(RSS_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH, RSS_VALIDATION_MESSAGES.SEARCH_MIN_LENGTH)
    .max(RSS_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, RSS_VALIDATION_MESSAGES.SEARCH_MAX_LENGTH)
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