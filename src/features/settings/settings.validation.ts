/**
 * Settings Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 */

import { z } from 'zod';
import { 
  SETTING_KEY_CONSTRAINTS,
  SETTING_DESCRIPTION_CONSTRAINTS,
  BULK_UPDATE_CONSTRAINTS,
  SETTING_TYPES,
  SETTING_CATEGORIES_ARRAY,
  SETTINGS_VALIDATION_MESSAGES 
} from './settings.constants';

// ==================== VALIDATION SCHEMAS ====================

/**
 * Create Setting Validation Schema
 * 
 * Yeni ayar oluşturma için validasyon kuralları:
 * - Key: 2-100 karakter, zorunlu, unique
 * - Value: String formatında, zorunlu
 * - Type: Geçerli SettingType enum değeri
 * - Description: Opsiyonel, maksimum 500 karakter
 * - Category: Opsiyonel, geçerli SettingCategory enum değeri
 */
export const createSettingSchema = z.object({
  key: z
    .string()
    .min(SETTING_KEY_CONSTRAINTS.MIN_LENGTH, SETTINGS_VALIDATION_MESSAGES.KEY_TOO_SHORT)
    .max(SETTING_KEY_CONSTRAINTS.MAX_LENGTH, SETTINGS_VALIDATION_MESSAGES.KEY_TOO_LONG)
    .regex(SETTING_KEY_CONSTRAINTS.REGEX, SETTINGS_VALIDATION_MESSAGES.KEY_INVALID_CHARS)
    .min(1, SETTINGS_VALIDATION_MESSAGES.KEY_REQUIRED),
  
  value: z
    .string()
    .min(1, SETTINGS_VALIDATION_MESSAGES.VALUE_REQUIRED),
  
  type: z
    .enum(SETTING_TYPES, {
      errorMap: () => ({ message: SETTINGS_VALIDATION_MESSAGES.INVALID_SETTING_TYPE })
    }),
  
  description: z
    .string()
    .max(SETTING_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, SETTINGS_VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG)
    .optional(),
  
  category: z
    .enum(SETTING_CATEGORIES_ARRAY, {
      errorMap: () => ({ message: SETTINGS_VALIDATION_MESSAGES.INVALID_CATEGORY })
    })
    .optional(),
});

/**
 * Update Setting Validation Schema
 * 
 * Mevcut ayar güncelleme için validasyon kuralları:
 * - Value: String formatında, zorunlu
 * - Description: Opsiyonel, maksimum 500 karakter
 */
export const updateSettingSchema = z.object({
  value: z
    .string()
    .min(1, SETTINGS_VALIDATION_MESSAGES.VALUE_REQUIRED),
  
  description: z
    .string()
    .max(SETTING_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, SETTINGS_VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG)
    .optional(),
});

/**
 * Bulk Update Settings Validation Schema
 * 
 * Birden fazla ayarı güncelleme için validasyon kuralları:
 * - Settings: Array of key-value pairs
 */
export const bulkUpdateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z
          .string()
          .min(1, SETTINGS_VALIDATION_MESSAGES.KEY_REQUIRED),
        value: z
          .string()
          .min(1, SETTINGS_VALIDATION_MESSAGES.VALUE_REQUIRED),
      })
    )
    .min(BULK_UPDATE_CONSTRAINTS.MIN_SETTINGS, SETTINGS_VALIDATION_MESSAGES.MIN_SETTINGS_REQUIRED),
});

/**
 * Settings Filter Validation Schema
 * 
 * Ayar filtreleme için validasyon kuralları:
 * - Category: Opsiyonel, geçerli SettingCategory enum değeri
 * - Search: Opsiyonel, arama terimi
 * - Type: Opsiyonel, geçerli SettingType enum değeri
 */
export const settingsFilterSchema = z.object({
  category: z
    .enum(SETTING_CATEGORIES_ARRAY)
    .optional(),
  
  search: z
    .string()
    .optional(),
  
  type: z
    .enum(SETTING_TYPES)
    .optional(),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type BulkUpdateSettingsInput = z.infer<typeof bulkUpdateSettingsSchema>;
export type SettingsFilterInput = z.infer<typeof settingsFilterSchema>; 