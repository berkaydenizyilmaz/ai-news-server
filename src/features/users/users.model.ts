/**
 * Users Feature Data Access Layer
 * 
 * Supabase veritabanı ile users işlemleri için CRUD operasyonları.
 * Admin kullanıcı yönetimi ve istatistik hesaplamaları için veritabanı sorgularını içerir.
 * 
 */

import { supabaseAdmin } from '@/database';
import { User, UserWithStats } from '@/core/types/database.types';
import { UsersQueryOptions } from './users.types';

/**
 * Users Model Class
 * 
 * Static metodlarla kullanıcı CRUD işlemlerini ve istatistik hesaplamalarını yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class UsersModel {
  
  // ==================== USER LISTING METHODS ====================
  
  /**
   * Get Users with Pagination and Filtering
   * 
   * Kullanıcı listesini pagination, filtering ve sorting ile getirir.
   * Admin paneli için kullanıcı yönetimi listesi.
   * 
   * @param options - Query seçenekleri (pagination, filtering, sorting)
   * @returns {Promise<{users: UserWithStats[], total: number}>} Kullanıcı listesi ve toplam sayı
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async getUsers(options: UsersQueryOptions): Promise<{users: UserWithStats[], total: number}> {
    try {
      // Base query oluştur
      let query = supabaseAdmin
        .from('users')
        .select(`
          *,
          comment_count:comments(count),
          forum_post_count:forum_posts(count)
        `, { count: 'exact' });

      // Filtering uygula
      if (options.search) {
        query = query.or(`email.ilike.%${options.search}%,username.ilike.%${options.search}%`);
      }

      if (options.role) {
        query = query.eq('role', options.role);
      }

      if (options.is_active !== undefined) {
        query = query.eq('is_active', options.is_active);
      }

      // Sorting uygula
      query = query.order(options.sort, { ascending: options.sort_direction === 'asc' });

      // Pagination uygula
      query = query.range(options.offset, options.offset + options.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0 };
      }

      // İstatistikleri hesapla ve UserWithStats formatına dönüştür
      const usersWithStats: UserWithStats[] = (data || []).map(user => ({
        ...user,
        comment_count: Array.isArray(user.comment_count) ? user.comment_count.length : 0,
        forum_post_count: Array.isArray(user.forum_post_count) ? user.forum_post_count.length : 0,
        unread_notifications: 0, // Bu ayrı bir sorgu ile hesaplanabilir
      }));

      return {
        users: usersWithStats,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { users: [], total: 0 };
    }
  }

  /**
   * Get User by ID with Statistics
   * 
   * Kullanıcı ID'sine göre kullanıcıyı istatistikleriyle birlikte getirir.
   * 
   * @param userId - Aranacak kullanıcı ID'si
   * @returns {Promise<UserWithStats | null>} Bulunan kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async getUserById(userId: string): Promise<UserWithStats | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          comment_count:comments(count),
          forum_post_count:forum_posts(count)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error finding user by id:', error);
        return null;
      }

      // İstatistikleri hesapla ve UserWithStats formatına dönüştür
      const userWithStats: UserWithStats = {
        ...data,
        comment_count: Array.isArray(data.comment_count) ? data.comment_count.length : 0,
        forum_post_count: Array.isArray(data.forum_post_count) ? data.forum_post_count.length : 0,
        unread_notifications: 0, // Bu ayrı bir sorgu ile hesaplanabilir
      };

      return userWithStats;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  // ==================== USER UPDATE METHODS ====================

  /**
   * Update User
   * 
   * Kullanıcı bilgilerini günceller (admin işlemi).
   * Sadece gönderilen alanları günceller (partial update).
   * 
   * @param userId - Güncellenecek kullanıcı ID'si
   * @param updateData - Güncellenecek kullanıcı verileri
   * @returns {Promise<User | null>} Güncellenen kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateUser(userId: string, updateData: Partial<Pick<User, 'email' | 'username' | 'avatar_url' | 'role' | 'is_active'>>): Promise<User | null> {
    try {
      // Boş obje kontrolü
      if (Object.keys(updateData).length === 0) {
        return null;
      }

      // Avatar URL boş string ise null'a çevir
      const cleanedData = { ...updateData };
      if (cleanedData.avatar_url === '') {
        cleanedData.avatar_url = undefined;
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          ...cleanedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return null;
    }
  }

  /**
   * Update User Role
   * 
   * Kullanıcının rolünü günceller.
   * 
   * @param userId - Rolü güncellenecek kullanıcı ID'si
   * @param role - Yeni kullanıcı rolü
   * @returns {Promise<User | null>} Güncellenen kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateUserRole(userId: string, role: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return null;
    }
  }

  /**
   * Update User Status
   * 
   * Kullanıcının aktiflik durumunu günceller.
   * 
   * @param userId - Durumu güncellenecek kullanıcı ID'si
   * @param isActive - Yeni aktiflik durumu
   * @returns {Promise<User | null>} Güncellenen kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateUserStatus(userId: string, isActive: boolean): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      return null;
    }
  }

  // ==================== USER DELETE METHODS ====================

  /**
   * Delete User (Soft Delete)
   * 
   * Kullanıcıyı soft delete yapar (is_active = false).
   * Gerçek silme yerine deaktive etme tercih edilir.
   * 
   * @param userId - Silinecek kullanıcı ID'si
   * @returns {Promise<boolean>} Silme işlemi başarılı mı?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }

  // ==================== DUPLICATE CHECK METHODS ====================

  /**
   * Check Email or Username Exists for Update
   * 
   * Kullanıcı güncelleme sırasında email ve username'in başka kullanıcılar
   * tarafından kullanılıp kullanılmadığını kontrol eder.
   * Kendi bilgilerini güncelleme durumunu hariç tutar.
   * 
   * @param email - Kontrol edilecek email adresi
   * @param username - Kontrol edilecek kullanıcı adı
   * @param excludeUserId - Kontrolden hariç tutulacak kullanıcı ID'si
   * @returns {Promise<{emailExists: boolean, usernameExists: boolean}>}
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async checkEmailOrUsernameExistsForUpdate(
    email?: string, 
    username?: string, 
    excludeUserId?: string
  ): Promise<{ emailExists: boolean; usernameExists: boolean }> {
    try {
      const checks = [];

      // Email kontrolü
      if (email) {
        const emailQuery = supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email);
        
        if (excludeUserId) {
          emailQuery.neq('id', excludeUserId);
        }
        
        checks.push(emailQuery.single());
      } else {
        checks.push(Promise.resolve({ data: null }));
      }

      // Username kontrolü
      if (username) {
        const usernameQuery = supabaseAdmin
          .from('users')
          .select('id')
          .eq('username', username);
        
        if (excludeUserId) {
          usernameQuery.neq('id', excludeUserId);
        }
        
        checks.push(usernameQuery.single());
      } else {
        checks.push(Promise.resolve({ data: null }));
      }

      const [emailCheck, usernameCheck] = await Promise.all(checks);

      return {
        emailExists: emailCheck.data !== null,
        usernameExists: usernameCheck.data !== null,
      };
    } catch (error) {
      console.error('Error in checkEmailOrUsernameExistsForUpdate:', error);
      return { emailExists: false, usernameExists: false };
    }
  }

  // ==================== STATISTICS METHODS ====================

  /**
   * Get Users Statistics
   * 
   * Kullanıcı istatistiklerini getirir (toplam, aktif, pasif sayıları).
   * 
   * @returns {Promise<{total: number, active: number, inactive: number}>}
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async getUsersStatistics(): Promise<{total: number, active: number, inactive: number}> {
    try {
      const [totalResult, activeResult, inactiveResult] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_active', false),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
      };
    } catch (error) {
      console.error('Error in getUsersStatistics:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }
} 