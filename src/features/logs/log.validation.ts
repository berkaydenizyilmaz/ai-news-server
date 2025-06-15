/**
 * Log Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * Log API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';
import { 
  MESSAGE_CONSTRAINTS,
  MODULE_ACTION_CONSTRAINTS,
  QUERY_CONSTRAINTS,
  LOG_LEVELS,
  LOG_MODULES,
  LOG_VALIDATION_MESSAGES 
} from './log.constants';

// ==================== VALIDATION SCHEMAS ====================

/**
 * Create Log Validation Schema
 * 
 * Yeni log kaydı oluşturma için validasyon kuralları:
 * - Level: Geçerli log seviyesi, zorunlu
 * - Message: 1-2000 karakter, zorunlu
 * - Module: Opsiyonel, maksimum 50 karakter
 * - Action: Opsiyonel, maksimum 100 karakter
 * - Metadata: Opsiyonel JSON objesi
 */
export const createLogSchema = z.object({
  level: z
    .enum(LOG_LEVELS, {
      errorMap: () => ({ message: LOG_VALIDATION_MESSAGES.INVALID_LOG_LEVEL })
    }),
  
  message: z
    .string()
    .min(MESSAGE_CONSTRAINTS.MIN_LENGTH, LOG_VALIDATION_MESSAGES.MESSAGE_REQUIRED)
    .max(MESSAGE_CONSTRAINTS.MAX_LENGTH, LOG_VALIDATION_MESSAGES.MESSAGE_TOO_LONG)
    .trim(),
  
  module: z
    .enum(LOG_MODULES, {
      errorMap: () => ({ message: LOG_VALIDATION_MESSAGES.INVALID_MODULE })
    })
    .optional(),
  
  action: z
    .string()
    .max(MODULE_ACTION_CONSTRAINTS.ACTION_MAX_LENGTH, LOG_VALIDATION_MESSAGES.ACTION_TOO_LONG)
    .trim()
    .optional(),
  
  metadata: z
    .record(z.any())
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        try {
          JSON.stringify(data);
          return true;
        } catch {
          return false;
        }
      },
      { message: LOG_VALIDATION_MESSAGES.INVALID_METADATA }
    ),
});

/**
 * Get Logs Query Validation Schema
 * 
 * Log listesi sorgusu için validasyon kuralları:
 * - Page: Pozitif sayı, opsiyonel (default: 1)
 * - Limit: 1-100 arası, opsiyonel (default: 50)
 * - Level: Geçerli log seviyesi, opsiyonel
 * - Module, Action: String, opsiyonel
 * - User ID: UUID formatı, opsiyonel
 * - Tarihler: ISO string formatı, opsiyonel
 * - Search: String, opsiyonel
 */
export const getLogsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : QUERY_CONSTRAINTS.PAGE_MIN)
    .refine((val) => val > 0, { message: LOG_VALIDATION_MESSAGES.INVALID_PAGE }),
  
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : QUERY_CONSTRAINTS.LIMIT_DEFAULT)
    .refine((val) => val >= QUERY_CONSTRAINTS.LIMIT_MIN && val <= QUERY_CONSTRAINTS.LIMIT_MAX, { 
      message: LOG_VALIDATION_MESSAGES.INVALID_LIMIT 
    }),
  
  level: z
    .enum(LOG_LEVELS)
    .optional(),
  
  module: z
    .enum(LOG_MODULES)
    .optional(),
  
  action: z
    .string()
    .max(MODULE_ACTION_CONSTRAINTS.ACTION_MAX_LENGTH, LOG_VALIDATION_MESSAGES.ACTION_TOO_LONG)
    .trim()
    .optional(),
  
  user_id: z
    .string()
    .uuid(LOG_VALIDATION_MESSAGES.INVALID_USER_ID)
    .optional(),
  
  start_date: z
    .string()
    .datetime(LOG_VALIDATION_MESSAGES.INVALID_START_DATE)
    .optional(),
  
  end_date: z
    .string()
    .datetime(LOG_VALIDATION_MESSAGES.INVALID_END_DATE)
    .optional(),
  
  search: z
    .string()
    .max(QUERY_CONSTRAINTS.SEARCH_MAX_LENGTH, LOG_VALIDATION_MESSAGES.SEARCH_TOO_LONG)
    .trim()
    .optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: LOG_VALIDATION_MESSAGES.INVALID_DATE_RANGE,
    path: ['start_date']
  }
);

/**
 * Log ID Parameter Validation Schema
 * 
 * URL parametresindeki log ID'si için validasyon:
 * - ID: UUID formatı, zorunlu
 */
export const logIdParamSchema = z.object({
  id: z
    .string()
    .uuid(LOG_VALIDATION_MESSAGES.INVALID_LOG_ID),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type GetLogsQueryInput = z.infer<typeof getLogsQuerySchema>;
export type LogIdParamInput = z.infer<typeof logIdParamSchema>; 