/**
 * Authentication Feature Data Access Layer
 * 
 * Supabase veritabanı ile auth işlemleri için CRUD operasyonları.
 * Kullanıcı yönetimi, şifre işlemleri ve veritabanı sorgularını içerir.
 * 
 */

import { supabaseAdmin } from '@/database';
import { User } from '@/core/types/database.types';
import { RegisterInput } from './auth.validation';
import { DEFAULT_USER_ROLE, USER_STATUS } from './auth.constants';

/**
 * Authentication Model Class
 * 
 * Static metodlarla kullanıcı CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class AuthModel {
  
  // ==================== USER CREATION ====================
  
  /**
   * Create New User
   * 
   * Yeni kullanıcı kaydı oluşturur. Admin client kullanarak
   * RLS kurallarını bypass eder ve direkt veritabanına yazar.
   * 
   * @param userData - Kullanıcı bilgileri (email, username, password_hash)
   * @returns {Promise<User | null>} Oluşturulan kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async createUser(userData: RegisterInput & { password_hash: string }): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: userData.email,
          username: userData.username,
          password_hash: userData.password_hash,
          role: DEFAULT_USER_ROLE,
          is_active: USER_STATUS.ACTIVE,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createUser:', error);
      return null;
    }
  }

  // ==================== USER LOOKUP METHODS ====================

  /**
   * Find User by Email
   * 
   * Email adresine göre kullanıcı arar. Login işlemlerinde kullanılır.
   * 
   * @param email - Aranacak email adresi
   * @returns {Promise<User | null>} Bulunan kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error finding user by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      return null;
    }
  }

  /**
   * Find User by ID
   * 
   * Kullanıcı ID'sine göre kullanıcı arar. Profil işlemlerinde kullanılır.
   * 
   * @param userId - Aranacak kullanıcı ID'si
   * @returns {Promise<User | null>} Bulunan kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error finding user by id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  // ==================== DUPLICATE CHECK METHODS ====================

  /**
   * Check Email or Username Exists
   * 
   * Kayıt sırasında email ve username'in daha önce kullanılıp
   * kullanılmadığını kontrol eder. Duplicate kayıtları önler.
   * 
   * @param email - Kontrol edilecek email adresi
   * @param username - Kontrol edilecek kullanıcı adı
   * @returns {Promise<{emailExists: boolean, usernameExists: boolean}>}
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async checkEmailOrUsernameExists(email: string, username: string): Promise<{ emailExists: boolean; usernameExists: boolean }> {
    try {
      const [emailCheck, usernameCheck] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .single(),
        supabaseAdmin
          .from('users')
          .select('id')
          .eq('username', username)
          .single()
      ]);

      return {
        emailExists: emailCheck.data !== null,
        usernameExists: usernameCheck.data !== null,
      };
    } catch (error) {
      console.error('Error in checkEmailOrUsernameExists:', error);
      return { emailExists: false, usernameExists: false };
    }
  }

  // ==================== USER UPDATE METHODS ====================

  /**
   * Update User Password
   * 
   * Kullanıcının şifresini günceller. Hash'lenmiş şifre alır.
   * 
   * @param userId - Şifresi güncellenecek kullanıcı ID'si
   * @param passwordHash - Yeni hash'lenmiş şifre
   * @returns {Promise<boolean>} Güncelleme başarılı mı?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating password:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      return false;
    }
  }

  /**
   * Update Last Login Time
   * 
   * Kullanıcının son giriş zamanını günceller. Login işleminde çağrılır.
   * 
   * @param userId - Giriş yapan kullanıcı ID'si
   * @returns {Promise<boolean>} Güncelleme başarılı mı?
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating last login:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      return false;
    }
  }

  /**
   * Update User Profile
   * 
   * Kullanıcının profil bilgilerini günceller (email, username, avatar).
   * Sadece gönderilen alanları günceller (partial update).
   * 
   * @param userId - Profili güncellenecek kullanıcı ID'si
   * @param profileData - Güncellenecek profil verileri
   * @returns {Promise<User | null>} Güncellenen kullanıcı veya null
   * @throws {Error} Veritabanı hatası durumunda
   */
  static async updateProfile(userId: string, profileData: Partial<Pick<User, 'email' | 'username' | 'avatar_url'>>): Promise<User | null> {
    try {
      // Boş obje kontrolü
      if (Object.keys(profileData).length === 0) {
        return null;
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  }

  /**
   * Check Email or Username Exists for Update
   * 
   * Profil güncelleme sırasında email ve username'in başka kullanıcılar
   * tarafından kullanılıp kullanılmadığını kontrol eder.
   * Kendi bilgilerini güncelleme durumunu hariç tutar.
   * 
   * @param email - Kontrol edilecek email adresi
   * @param username - Kontrol edilecek kullanıcı adı
   * @param excludeUserId - Kontrolden hariç tutulacak kullanıcı ID'si (kendisi)
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
} 