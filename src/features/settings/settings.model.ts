/**
 * Settings Feature Data Access Layer
 * 
 * Supabase veritabanı ile settings işlemleri için CRUD operasyonları.
 * Sistem ayarları yönetimi ve veritabanı sorgularını içerir.
 */

import { supabaseAdmin } from '@/database';
import { Setting } from '@/core/types/database.types';
import { CreateSettingInput, SettingsFilterInput } from './settings.validation';
import { SettingCategory } from '@/core/types/database.types';

/**
 * Settings Model Class
 * 
 * Static metodlarla ayar CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class SettingsModel {
  
  // ==================== SETTING CREATION ====================
  
  /**
   * Create New Setting
   * 
   * Yeni sistem ayarı oluşturur. Admin client kullanarak
   * RLS kurallarını bypass eder ve direkt veritabanına yazar.
   * 
   * @param settingData - Ayar bilgileri (key, value, type, description, category)
   * @returns {Promise<Setting | null>} Oluşturulan ayar veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async createSetting(settingData: CreateSettingInput): Promise<Setting | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .insert({
          key: settingData.key,
          value: settingData.value,
          type: settingData.type,
          description: settingData.description,
          category: settingData.category,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating setting:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createSetting:', error);
      return null;
    }
  }

  // ==================== SETTING LOOKUP METHODS ====================

  /**
   * Get All Settings
   * 
   * Tüm sistem ayarlarını getirir. Filtreleme seçenekleri ile
   * kategori, tip veya arama terimine göre filtrelenebilir.
   * 
   * @param filters - Filtreleme seçenekleri (opsiyonel)
   * @returns {Promise<Setting[]>} Ayarlar listesi
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async getAllSettings(filters?: SettingsFilterInput): Promise<Setting[]> {
    try {
      let query = supabaseAdmin
        .from('settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      // Kategori filtresi
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      // Tip filtresi
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      // Arama filtresi (key veya description'da arama)
      if (filters?.search) {
        query = query.or(`key.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting all settings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllSettings:', error);
      return [];
    }
  }

  /**
   * Find Setting by Key
   * 
   * Ayar anahtarına göre tek bir ayar arar.
   * 
   * @param key - Aranacak ayar anahtarı
   * @returns {Promise<Setting | null>} Bulunan ayar veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async findByKey(key: string): Promise<Setting | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error finding setting by key:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findByKey:', error);
      return null;
    }
  }

  /**
   * Get Settings by Category
   * 
   * Belirli bir kategorideki tüm ayarları getirir.
   * 
   * @param category - Ayar kategorisi
   * @returns {Promise<Setting[]>} Kategorideki ayarlar
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async getByCategory(category: SettingCategory): Promise<Setting[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('category', category)
        .order('key', { ascending: true });

      if (error) {
        console.error('Error getting settings by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByCategory:', error);
      return [];
    }
  }

  // ==================== SETTING UPDATE METHODS ====================

  /**
   * Update Setting
   * 
   * Mevcut ayarı günceller. Sadece value ve description güncellenebilir.
   * 
   * @param key - Güncellenecek ayar anahtarı
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<Setting | null>} Güncellenen ayar veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateSetting(key: string, updateData: { value: string; description?: string }): Promise<Setting | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .update({
          value: updateData.value,
          description: updateData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('Error updating setting:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      return null;
    }
  }

  /**
   * Bulk Update Settings
   * 
   * Birden fazla ayarı aynı anda günceller.
   * 
   * @param settings - Güncellenecek ayarlar (key-value pairs)
   * @returns {Promise<boolean>} Güncelleme başarılı mı?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async bulkUpdateSettings(settings: Array<{ key: string; value: string }>): Promise<boolean> {
    try {
      // Her ayar için ayrı güncelleme sorgusu çalıştır
      const updatePromises = settings.map(setting =>
        supabaseAdmin
          .from('settings')
          .update({
            value: setting.value,
            updated_at: new Date().toISOString(),
          })
          .eq('key', setting.key)
      );

      const results = await Promise.all(updatePromises);

      // Tüm güncellemelerin başarılı olup olmadığını kontrol et
      const hasError = results.some(result => result.error);

      if (hasError) {
        console.error('Error in bulk update settings');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in bulkUpdateSettings:', error);
      return false;
    }
  }

  // ==================== SETTING DELETE METHODS ====================

  /**
   * Delete Setting
   * 
   * Ayarı veritabanından siler.
   * 
   * @param key - Silinecek ayar anahtarı
   * @returns {Promise<boolean>} Silme işlemi başarılı mı?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async deleteSetting(key: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('settings')
        .delete()
        .eq('key', key);

      if (error) {
        console.error('Error deleting setting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSetting:', error);
      return false;
    }
  }

  // ==================== DUPLICATE CHECK METHODS ====================

  /**
   * Check Setting Key Exists
   * 
   * Ayar anahtarının daha önce kullanılıp kullanılmadığını kontrol eder.
   * Duplicate kayıtları önler.
   * 
   * @param key - Kontrol edilecek ayar anahtarı
   * @returns {Promise<boolean>} Anahtar mevcut mu?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async checkKeyExists(key: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('id')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking key exists:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in checkKeyExists:', error);
      return false;
    }
  }
}   