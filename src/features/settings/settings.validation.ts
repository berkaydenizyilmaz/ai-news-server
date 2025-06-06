/**
 * Settings Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 */

import { z } from 'zod';

// ==================== VALIDATION CONSTANTS ====================

// Setting key ve description için minimum/maksimum değerler
const SETTING_KEY_MIN_LENGTH = 2;
const SETTING_KEY_MAX_LENGTH = 100;
const SETTING_DESCRIPTION_MAX_LENGTH = 500;

// Desteklenen setting tipleri ve kategorileri
const SETTING_TYPES = ['string', 'number', 'boolean', 'json'] as const;
const SETTING_CATEGORIES = ['rss', 'ai', 'general', 'auth', 'news', 'forum'] as const;

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
    .min(SETTING_KEY_MIN_LENGTH, `Ayar anahtarı en az ${SETTING_KEY_MIN_LENGTH} karakter olmalıdır`)
    .max(SETTING_KEY_MAX_LENGTH, `Ayar anahtarı en fazla ${SETTING_KEY_MAX_LENGTH} karakter olmalıdır`)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Ayar anahtarı sadece harf, rakam, alt çizgi, nokta ve tire içerebilir')
    .min(1, 'Ayar anahtarı zorunludur'),
  
  value: z
    .string()
    .min(1, 'Ayar değeri zorunludur'),
  
  type: z
    .enum(SETTING_TYPES, {
      errorMap: () => ({ message: 'Geçerli bir ayar tipi seçiniz' })
    }),
  
  description: z
    .string()
    .max(SETTING_DESCRIPTION_MAX_LENGTH, `Açıklama en fazla ${SETTING_DESCRIPTION_MAX_LENGTH} karakter olmalıdır`)
    .optional(),
  
  category: z
    .enum(SETTING_CATEGORIES, {
      errorMap: () => ({ message: 'Geçerli bir kategori seçiniz' })
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
    .min(1, 'Ayar değeri zorunludur'),
  
  description: z
    .string()
    .max(SETTING_DESCRIPTION_MAX_LENGTH, `Açıklama en fazla ${SETTING_DESCRIPTION_MAX_LENGTH} karakter olmalıdır`)
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
          .min(1, 'Ayar anahtarı zorunludur'),
        value: z
          .string()
          .min(1, 'Ayar değeri zorunludur'),
      })
    )
    .min(1, 'En az bir ayar güncellenmeli'),
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
    .enum(SETTING_CATEGORIES)
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