/**
 * Settings Feature Type Definitions
 * 
 * Settings modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve ayar işlemleri.
 * 
 */

import { Setting, SettingType, SettingCategory } from '@/core/types/database.types';

// ==================== SETTINGS REQUEST DTOs ====================

/**
 * Create Setting Request DTO
 * 
 * Yeni ayar oluşturma için gerekli veriler.
 * Admin panelinden gelen form verilerinin tipi.
 */
export interface CreateSettingRequest {
  key: string;           // Ayar anahtarı (unique)
  value: string;         // Ayar değeri (string formatında)
  type: SettingType;     // Değer tipi (string, number, boolean, json)
  description?: string;  // Ayar açıklaması
  category?: SettingCategory; // Ayar kategorisi
}

/**
 * Update Setting Request DTO
 * 
 * Mevcut ayar güncelleme için gerekli veriler.
 * Key değeri değiştirilemez, sadece value ve description güncellenebilir.
 */
export interface UpdateSettingRequest {
  value: string;         // Yeni ayar değeri
  description?: string;  // Yeni açıklama (opsiyonel)
}

/**
 * Bulk Update Settings Request DTO
 * 
 * Birden fazla ayarı aynı anda güncelleme için kullanılır.
 * Admin panelinde kategori bazlı toplu güncelleme için.
 */
export interface BulkUpdateSettingsRequest {
  settings: Array<{
    key: string;
    value: string;
  }>;
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Settings Service Response Interface
 * 
 * Tüm settings servis metodlarının standart dönüş tipi.
 * Success/error durumlarını tip güvenli şekilde yönetir.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface SettingServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== TYPED SETTING VALUES ====================

/**
 * Typed Setting Value Interface
 * 
 * Ayar değerlerinin tip güvenli şekilde kullanılması için.
 * Runtime'da tip dönüşümü yapılır.
 */
export interface TypedSettingValue {
  key: string;
  value: string | number | boolean | object;
  type: SettingType;
} 