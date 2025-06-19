/**
 * Reports Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';
import { 
  REPORT_REASON_CONSTRAINTS,
  REPORT_DESCRIPTION_CONSTRAINTS,
  REPORT_QUERY_CONSTRAINTS,
  REPORT_TYPES,
  REPORT_STATUS_TYPES,
  REPORT_VALIDATION_MESSAGES
} from './reports.constants';

// ==================== VALIDATION SCHEMAS ====================

/**
 * Report Creation Validation Schema
 * 
 * Yeni şikayet oluşturma için validasyon kuralları:
 * - Reported Type: Geçerli tür (news, comment, forum_post, forum_topic)
 * - Reported ID: UUID formatında
 * - Reason: 3-255 karakter, zorunlu
 * - Description: Opsiyonel string, max 1000 karakter
 */
export const createReportSchema = z.object({
  reported_type: z
    .string()
    .refine(
      (val) => Object.values(REPORT_TYPES).includes(val as any),
      REPORT_VALIDATION_MESSAGES.REPORTED_TYPE_INVALID
    ),
  
  reported_id: z
    .string()
    .uuid(REPORT_VALIDATION_MESSAGES.REPORTED_ID_INVALID)
    .min(1, REPORT_VALIDATION_MESSAGES.REPORTED_ID_REQUIRED),
  
  reason: z
    .string()
    .min(REPORT_REASON_CONSTRAINTS.MIN_LENGTH, REPORT_VALIDATION_MESSAGES.REASON_MIN_LENGTH)
    .max(REPORT_REASON_CONSTRAINTS.MAX_LENGTH, REPORT_VALIDATION_MESSAGES.REASON_MAX_LENGTH)
    .min(1, REPORT_VALIDATION_MESSAGES.REASON_REQUIRED),
  
  description: z
    .string()
    .max(REPORT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, REPORT_VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH)
    .optional(),
});

/**
 * Report Review Validation Schema
 * 
 * Şikayet değerlendirme için validasyon kuralları:
 * - Status: Geçerli durum (reviewed, resolved, dismissed)
 * - Review Notes: Opsiyonel string
 */
export const reviewReportSchema = z.object({
  status: z
    .string()
    .refine(
      (val) => [REPORT_STATUS_TYPES.REVIEWED, REPORT_STATUS_TYPES.RESOLVED, REPORT_STATUS_TYPES.DISMISSED].includes(val as any),
      REPORT_VALIDATION_MESSAGES.STATUS_INVALID
    ),
  
  review_notes: z
    .string()
    .max(REPORT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, REPORT_VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH)
    .optional(),
});

/**
 * Bulk Report Action Validation Schema
 * 
 * Toplu şikayet işlemi için validasyon kuralları:
 * - Report IDs: UUID dizisi, en az 1 öğe
 * - Action: Geçerli işlem (resolve, dismiss)
 * - Review Notes: Opsiyonel string
 */
export const bulkReportActionSchema = z.object({
  report_ids: z
    .array(z.string().uuid(REPORT_VALIDATION_MESSAGES.UUID_INVALID))
    .min(1, 'En az bir şikayet seçilmelidir'),
  
  action: z
    .string()
    .refine(
      (val) => [REPORT_STATUS_TYPES.RESOLVED, REPORT_STATUS_TYPES.DISMISSED].includes(val as any),
      'Geçerli bir işlem seçiniz (resolve, dismiss)'
    ),
  
  review_notes: z
    .string()
    .max(REPORT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, REPORT_VALIDATION_MESSAGES.DESCRIPTION_MAX_LENGTH)
    .optional(),
});

/**
 * Report ID Validation Schema
 * 
 * URL parametrelerinden gelen şikayet ID'si için validasyon.
 */
export const reportIdSchema = z.object({
  id: z
    .string()
    .uuid(REPORT_VALIDATION_MESSAGES.REPORT_ID_INVALID),
});

/**
 * Report Query Parameters Validation Schema
 * 
 * Şikayet listesi için query parametreleri validasyonu:
 * - Page: Sayfa numarası
 * - Limit: Sayfa başına öğe sayısı
 * - Status: Durum filtresi
 * - Type: Tür filtresi
 * - Search: Arama terimi
 */
export const reportQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, REPORT_VALIDATION_MESSAGES.PAGE_INVALID)
    .transform(Number)
    .refine(val => val >= REPORT_QUERY_CONSTRAINTS.PAGE_MIN, REPORT_VALIDATION_MESSAGES.PAGE_MIN)
    .optional()
    .default('1'),
  
  limit: z
    .string()
    .regex(/^\d+$/, REPORT_VALIDATION_MESSAGES.LIMIT_INVALID)
    .transform(Number)
    .refine(val => val >= REPORT_QUERY_CONSTRAINTS.LIMIT_MIN && val <= REPORT_QUERY_CONSTRAINTS.LIMIT_MAX, REPORT_VALIDATION_MESSAGES.LIMIT_RANGE)
    .optional()
    .default(REPORT_QUERY_CONSTRAINTS.LIMIT_DEFAULT.toString()),
  
  status: z
    .string()
    .refine(
      (val) => Object.values(REPORT_STATUS_TYPES).includes(val as any),
      REPORT_VALIDATION_MESSAGES.STATUS_INVALID
    )
    .optional(),
  
  reported_type: z
    .string()
    .refine(
      (val) => Object.values(REPORT_TYPES).includes(val as any),
      REPORT_VALIDATION_MESSAGES.REPORTED_TYPE_INVALID
    )
    .optional(),
  
  search: z
    .string()
    .min(REPORT_QUERY_CONSTRAINTS.SEARCH_MIN_LENGTH, REPORT_VALIDATION_MESSAGES.SEARCH_MIN_LENGTH)
    .max(REPORT_QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, REPORT_VALIDATION_MESSAGES.SEARCH_MAX_LENGTH)
    .optional(),
  
  date_from: z
    .string()
    .datetime({ message: 'Geçerli bir tarih formatı giriniz (ISO 8601)' })
    .optional(),
  
  date_to: z
    .string()
    .datetime({ message: 'Geçerli bir tarih formatı giriniz (ISO 8601)' })
    .optional(),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
export type BulkReportActionInput = z.infer<typeof bulkReportActionSchema>;
export type ReportIdInput = z.infer<typeof reportIdSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>; 