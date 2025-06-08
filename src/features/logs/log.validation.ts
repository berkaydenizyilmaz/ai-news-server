/**
 * Log Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * Log API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';

// ==================== VALIDATION CONSTANTS ====================

// Log mesajı için minimum/maksimum değerler
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 2000;
const MODULE_MAX_LENGTH = 50;
const ACTION_MAX_LENGTH = 100;

// Geçerli log seviyeleri
const LOG_LEVELS = ['info', 'warning', 'error', 'debug'] as const;

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
      errorMap: () => ({ message: 'Geçerli bir log seviyesi seçiniz (info, warning, error, debug)' })
    }),
  
  message: z
    .string()
    .min(MESSAGE_MIN_LENGTH, 'Log mesajı boş olamaz')
    .max(MESSAGE_MAX_LENGTH, `Log mesajı en fazla ${MESSAGE_MAX_LENGTH} karakter olabilir`)
    .trim(),
  
  module: z
    .string()
    .max(MODULE_MAX_LENGTH, `Modül adı en fazla ${MODULE_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  action: z
    .string()
    .max(ACTION_MAX_LENGTH, `Aksiyon adı en fazla ${ACTION_MAX_LENGTH} karakter olabilir`)
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
      { message: 'Metadata geçerli bir JSON objesi olmalıdır' }
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
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => val > 0, { message: 'Sayfa numarası pozitif olmalıdır' }),
  
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 50)
    .refine((val) => val >= 1 && val <= 100, { 
      message: 'Limit 1-100 arasında olmalıdır' 
    }),
  
  level: z
    .enum(LOG_LEVELS)
    .optional(),
  
  module: z
    .string()
    .max(MODULE_MAX_LENGTH, `Modül adı en fazla ${MODULE_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  action: z
    .string()
    .max(ACTION_MAX_LENGTH, `Aksiyon adı en fazla ${ACTION_MAX_LENGTH} karakter olabilir`)
    .trim()
    .optional(),
  
  user_id: z
    .string()
    .uuid('Geçerli bir kullanıcı ID\'si giriniz')
    .optional(),
  
  start_date: z
    .string()
    .datetime('Geçerli bir başlangıç tarihi giriniz (ISO format)')
    .optional(),
  
  end_date: z
    .string()
    .datetime('Geçerli bir bitiş tarihi giriniz (ISO format)')
    .optional(),
  
  search: z
    .string()
    .max(200, 'Arama terimi en fazla 200 karakter olabilir')
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
    message: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır',
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
    .uuid('Geçerli bir log ID\'si giriniz'),
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