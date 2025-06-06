/**
 * Settings Feature Business Logic Layer
 * 
 * Settings işlemlerinin tüm iş mantığını içerir.
 * Ayar validasyonu, tip dönüşümü ve sistem ayarları yönetimi.
 * 
 */

import { SettingsModel } from './settings.model';
import { 
  CreateSettingInput, 
  UpdateSettingInput, 
  BulkUpdateSettingsInput,
  SettingsFilterInput
} from './settings.validation';
import { 
  SettingServiceResponse,
  TypedSettingValue
} from './settings.types';
import { Setting, SettingType } from '@/core/types/database.types';

/**
 * Settings Service Class
 * 
 * Static metodlarla settings iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class SettingsService {
  
  // ==================== SETTING CREATION ====================
  
  /**
   * Create Setting Business Logic
   * 
   * Yeni ayar oluşturma için tüm iş mantığını yönetir:
   * - Ayar anahtarı duplicate kontrolü
   * - Değer tip validasyonu
   * - Ayar oluşturma
   * 
   * @param settingData - Validasyon geçmiş ayar verisi
   * @returns {Promise<SettingServiceResponse<Setting>>} Oluşturma sonucu
   */
  static async createSetting(settingData: CreateSettingInput): Promise<SettingServiceResponse<Setting>> {
    try {
      // Ayar anahtarı duplicate kontrolü
      const keyExists = await SettingsModel.checkKeyExists(settingData.key);

      if (keyExists) {
        return {
          success: false,
          error: 'Bu ayar anahtarı zaten kullanılıyor',
        };
      }

      // Değer tip validasyonu
      if (!this.validateSettingValue(settingData.value, settingData.type)) {
        return {
          success: false,
          error: 'Ayar değeri belirtilen tip ile uyumlu değil',
        };
      }

      // Ayarı veritabanında oluştur
      const setting = await SettingsModel.createSetting(settingData);

      if (!setting) {
        return {
          success: false,
          error: 'Ayar oluşturulamadı',
        };
      }

      return {
        success: true,
        data: setting,
        message: 'Ayar başarıyla oluşturuldu',
      };
    } catch (error) {
      console.error('Error in createSetting service:', error);
      return {
        success: false,
        error: 'Ayar oluşturma sırasında bir hata oluştu',
      };
    }
  }

  // ==================== SETTING RETRIEVAL ====================

  /**
   * Get All Settings Business Logic
   * 
   * Tüm ayarları getirme ve filtreleme iş mantığını yönetir.
   * 
   * @param filters - Filtreleme seçenekleri
   * @returns {Promise<SettingServiceResponse<Setting[]>>} Ayarlar listesi
   */
  static async getAllSettings(filters?: SettingsFilterInput): Promise<SettingServiceResponse<Setting[]>> {
    try {
      const settings = await SettingsModel.getAllSettings(filters);

      return {
        success: true,
        data: settings,
        message: `${settings.length} ayar bulundu`,
      };
    } catch (error) {
      console.error('Error in getAllSettings service:', error);
      return {
        success: false,
        error: 'Ayarlar getirilirken bir hata oluştu',
      };
    }
  }

  /**
   * Get Setting by Key Business Logic
   * 
   * Tek bir ayarı anahtarına göre getirme iş mantığını yönetir.
   * 
   * @param key - Ayar anahtarı
   * @returns {Promise<SettingServiceResponse<Setting>>} Ayar sonucu
   */
  static async getSettingByKey(key: string): Promise<SettingServiceResponse<Setting>> {
    try {
      const setting = await SettingsModel.findByKey(key);

      if (!setting) {
        return {
          success: false,
          error: 'Ayar bulunamadı',
        };
      }

      return {
        success: true,
        data: setting,
      };
    } catch (error) {
      console.error('Error in getSettingByKey service:', error);
      return {
        success: false,
        error: 'Ayar getirilirken bir hata oluştu',
      };
    }
  }

  /**
   * Get Settings by Category Business Logic
   * 
   * Kategoriye göre ayarları getirme iş mantığını yönetir.
   * 
   * @param category - Ayar kategorisi
   * @returns {Promise<SettingServiceResponse<Setting[]>>} Kategori ayarları
   */
  static async getSettingsByCategory(category: string): Promise<SettingServiceResponse<Setting[]>> {
    try {
      const settings = await SettingsModel.getByCategory(category as any);

      return {
        success: true,
        data: settings,
        message: `${category} kategorisinde ${settings.length} ayar bulundu`,
      };
    } catch (error) {
      console.error('Error in getSettingsByCategory service:', error);
      return {
        success: false,
        error: 'Kategori ayarları getirilirken bir hata oluştu',
      };
    }
  }

  // ==================== SETTING UPDATE ====================

  /**
   * Update Setting Business Logic
   * 
   * Ayar güncelleme için tüm iş mantığını yönetir:
   * - Ayar varlık kontrolü
   * - Değer tip validasyonu
   * - Ayar güncelleme
   * 
   * @param key - Güncellenecek ayar anahtarı
   * @param updateData - Validasyon geçmiş güncelleme verisi
   * @returns {Promise<SettingServiceResponse<Setting>>} Güncelleme sonucu
   */
  static async updateSetting(key: string, updateData: UpdateSettingInput): Promise<SettingServiceResponse<Setting>> {
    try {
      // Ayarın varlığını kontrol et
      const existingSetting = await SettingsModel.findByKey(key);

      if (!existingSetting) {
        return {
          success: false,
          error: 'Ayar bulunamadı',
        };
      }

      // Değer tip validasyonu
      if (!this.validateSettingValue(updateData.value, existingSetting.type)) {
        return {
          success: false,
          error: 'Ayar değeri belirtilen tip ile uyumlu değil',
        };
      }

      // Ayarı güncelle
      const updatedSetting = await SettingsModel.updateSetting(key, updateData);

      if (!updatedSetting) {
        return {
          success: false,
          error: 'Ayar güncellenemedi',
        };
      }

      return {
        success: true,
        data: updatedSetting,
        message: 'Ayar başarıyla güncellendi',
      };
    } catch (error) {
      console.error('Error in updateSetting service:', error);
      return {
        success: false,
        error: 'Ayar güncelleme sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Bulk Update Settings Business Logic
   * 
   * Birden fazla ayarı güncelleme iş mantığını yönetir:
   * - Her ayar için varlık kontrolü
   * - Değer tip validasyonu
   * - Toplu güncelleme
   * 
   * @param bulkData - Validasyon geçmiş toplu güncelleme verisi
   * @returns {Promise<SettingServiceResponse<void>>} Güncelleme sonucu
   */
  static async bulkUpdateSettings(bulkData: BulkUpdateSettingsInput): Promise<SettingServiceResponse<void>> {
    try {
      // Her ayar için varlık ve tip kontrolü
      for (const settingUpdate of bulkData.settings) {
        const existingSetting = await SettingsModel.findByKey(settingUpdate.key);

        if (!existingSetting) {
          return {
            success: false,
            error: `Ayar bulunamadı: ${settingUpdate.key}`,
          };
        }

        if (!this.validateSettingValue(settingUpdate.value, existingSetting.type)) {
          return {
            success: false,
            error: `Geçersiz değer tipi: ${settingUpdate.key}`,
          };
        }
      }

      // Toplu güncelleme işlemi
      const success = await SettingsModel.bulkUpdateSettings(bulkData.settings);

      if (!success) {
        return {
          success: false,
          error: 'Ayarlar güncellenemedi',
        };
      }

      return {
        success: true,
        message: `${bulkData.settings.length} ayar başarıyla güncellendi`,
      };
    } catch (error) {
      console.error('Error in bulkUpdateSettings service:', error);
      return {
        success: false,
        error: 'Toplu güncelleme sırasında bir hata oluştu',
      };
    }
  }

  // ==================== SETTING DELETION ====================

  /**
   * Delete Setting Business Logic
   * 
   * Ayar silme için iş mantığını yönetir:
   * - Ayar varlık kontrolü
   * - Silme işlemi
   * 
   * @param key - Silinecek ayar anahtarı
   * @returns {Promise<SettingServiceResponse<void>>} Silme sonucu
   */
  static async deleteSetting(key: string): Promise<SettingServiceResponse<void>> {
    try {
      // Ayarın varlığını kontrol et
      const existingSetting = await SettingsModel.findByKey(key);

      if (!existingSetting) {
        return {
          success: false,
          error: 'Ayar bulunamadı',
        };
      }

      // Ayarı sil
      const success = await SettingsModel.deleteSetting(key);

      if (!success) {
        return {
          success: false,
          error: 'Ayar silinemedi',
        };
      }

      return {
        success: true,
        message: 'Ayar başarıyla silindi',
      };
    } catch (error) {
      console.error('Error in deleteSetting service:', error);
      return {
        success: false,
        error: 'Ayar silme sırasında bir hata oluştu',
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get Typed Setting Value
   * 
   * Ayar değerini tipine göre dönüştürür.
   * 
   * @param key - Ayar anahtarı
   * @returns {Promise<SettingServiceResponse<TypedSettingValue>>} Tip dönüşümlü değer
   */
  static async getTypedSettingValue(key: string): Promise<SettingServiceResponse<TypedSettingValue>> {
    try {
      const setting = await SettingsModel.findByKey(key);

      if (!setting) {
        return {
          success: false,
          error: 'Ayar bulunamadı',
        };
      }

      const typedValue = this.convertSettingValue(setting.value, setting.type);

      return {
        success: true,
        data: {
          key: setting.key,
          value: typedValue,
          type: setting.type,
        },
      };
    } catch (error) {
      console.error('Error in getTypedSettingValue service:', error);
      return {
        success: false,
        error: 'Ayar değeri dönüştürülürken bir hata oluştu',
      };
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate Setting Value Type
   * 
   * Ayar değerinin tipine göre validasyon yapar.
   * 
   * @param value - Ayar değeri (string formatında)
   * @param type - Ayar tipi
   * @returns {boolean} Değer geçerli mi?
   */
  private static validateSettingValue(value: string, type: SettingType): boolean {
    try {
      switch (type) {
        case 'string':
          return typeof value === 'string';
        
        case 'number':
          const numValue = parseFloat(value);
          return !isNaN(numValue) && isFinite(numValue);
        
        case 'boolean':
          return value === 'true' || value === 'false';
        
        case 'json':
          JSON.parse(value);
          return true;
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert Setting Value to Typed Value
   * 
   * String formatındaki ayar değerini tipine göre dönüştürür.
   * 
   * @param value - Ayar değeri (string formatında)
   * @param type - Ayar tipi
   * @returns {any} Tip dönüşümlü değer
   */
  private static convertSettingValue(value: string, type: SettingType): any {
    switch (type) {
      case 'string':
        return value;
      
      case 'number':
        return parseFloat(value);
      
      case 'boolean':
        return value === 'true';
      
      case 'json':
        return JSON.parse(value);
      
      default:
        return value;
    }
  }
} 