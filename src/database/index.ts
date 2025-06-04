/**
 * Supabase Database Connection Module
 * 
 * Bu modül iki farklı Supabase client'ı yönetir:
 * 1. Public Client (supabase) - Frontend için, RLS kurallarına tabi
 * 2. Admin Client (supabaseAdmin) - Backend için, RLS bypass, tam yetki
 * 
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config';

// Supabase client instances - singleton pattern
let supabaseClientInstance: SupabaseClient;
let supabaseAdminInstance: SupabaseClient;

/**
 * Public Supabase Client Factory
 * 
 * Anon key ile oluşturulan client. Frontend uygulamalar için kullanılır.
 * Row Level Security (RLS) kurallarına tabidir.
 * 
 * @returns {SupabaseClient} Public supabase client instance
 * @throws {Error} URL veya Anon Key eksikse hata fırlatır
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClientInstance) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    
    supabaseClientInstance = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }
  return supabaseClientInstance;
};

/**
 * Admin Supabase Client Factory
 * 
 * Service role key ile oluşturulan client. Backend işlemler için kullanılır.
 * RLS kurallarını bypass eder ve tüm veritabanına tam erişim sağlar.
 * Kullanıcı CRUD işlemleri, admin operasyonları için gereklidir.
 * 
 * @returns {SupabaseClient} Admin supabase client instance
 * @throws {Error} URL veya Service Key eksikse hata fırlatır
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Supabase URL and Service Role Key are required');
    }
    
    supabaseAdminInstance = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false, // Admin client için token refresh'e gerek yok
          persistSession: false,   // Session persist etmeye gerek yok
        },
      }
    );
  }
  return supabaseAdminInstance;
};

// Direct export instances - kolay kullanım için
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdmin();

/**
 * Database Connection Test
 * 
 * Supabase bağlantısını test eder. Uygulama başlangıcında çağrılmalıdır.
 * Basit bir sorgu ile bağlantının çalışıp çalışmadığını kontrol eder.
 * 
 * @returns {Promise<void>} Bağlantı başarılıysa resolve, değilse reject
 * @throws {Error} Bağlantı hatası durumunda hata fırlatır
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getSupabaseClient();
    
    // Test connection with a simple query
    const { error } = await client.from('users').select('count').limit(1);
    
    // PGRST116: No rows returned - bu normal, tablo boş olabilir
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Supabase connection established successfully');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    throw error;
  }
};

// Default export - backward compatibility için
export default {
  getSupabaseClient,
  getSupabaseAdmin,
  connectDatabase,
}; 