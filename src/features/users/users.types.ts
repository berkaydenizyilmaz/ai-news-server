/**
 * Users Feature Type Definitions
 * 
 * Users modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve query parametreleri.
 * 
 */

import { User, UserWithStats } from '@/core/types/database.types';
import { USERS_SORT_OPTIONS, USERS_SORT_DIRECTIONS } from './users.constants';

// ==================== USERS REQUEST DTOs ====================

/**
 * Get Users Query Parameters DTO
 * 
 * Kullanıcı listesi için query parametreleri.
 * Pagination, filtering ve sorting seçenekleri.
 */
export interface GetUsersQuery {
  limit?: number;           // Sayfa başına kayıt sayısı (default: 10)
  offset?: number;          // Atlanacak kayıt sayısı (default: 0)
  search?: string;          // Email veya username'de arama
  role?: string;            // Rol filtresi
  is_active?: boolean;      // Aktiflik durumu filtresi
  sort?: keyof typeof USERS_SORT_OPTIONS;     // Sıralama alanı
  sort_direction?: keyof typeof USERS_SORT_DIRECTIONS; // Sıralama yönü
}

/**
 * Update User Request DTO
 * 
 * Admin tarafından kullanıcı güncelleme için gerekli veriler.
 * Tüm alanlar opsiyonel - sadece değiştirilmek istenen alanlar gönderilir.
 */
export interface UpdateUserRequest {
  email?: string;          // Yeni email adresi
  username?: string;       // Yeni kullanıcı adı
  avatar_url?: string;     // Yeni avatar URL'i
  role?: string;           // Yeni kullanıcı rolü
  is_active?: boolean;     // Yeni aktiflik durumu
}

/**
 * Update User Role Request DTO
 * 
 * Kullanıcı rolü değiştirme için gerekli veriler.
 */
export interface UpdateUserRoleRequest {
  role: string; // Yeni kullanıcı rolü (zorunlu)
}

/**
 * Update User Status Request DTO
 * 
 * Kullanıcı durumu değiştirme için gerekli veriler.
 */
export interface UpdateUserStatusRequest {
  is_active: boolean; // Yeni aktiflik durumu (zorunlu)
}

// ==================== USERS RESPONSE DTOs ====================

/**
 * Users List Response DTO
 * 
 * Kullanıcı listesi endpoint'inin dönüş tipi.
 * Pagination bilgileri ve kullanıcı listesi içerir.
 */
export interface UsersListResponse {
  users: UserWithStats[];  // Kullanıcı listesi (istatistiklerle)
  pagination: {
    total: number;         // Toplam kullanıcı sayısı
    limit: number;         // Sayfa başına kayıt sayısı
    offset: number;        // Atlanmış kayıt sayısı
    has_more: boolean;     // Daha fazla kayıt var mı?
  };
}

/**
 * User Detail Response DTO
 * 
 * Tek kullanıcı detayı endpoint'inin dönüş tipi.
 * İstatistikler ve detaylı bilgiler içerir.
 */
export interface UserDetailResponse extends UserWithStats {
  // UserWithStats'tan gelen tüm alanlar
  // İleride ek detay alanları eklenebilir
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Users Service Response Interface
 * 
 * Tüm users servis metodlarının standart dönüş tipi.
 * Success/error durumlarını tip güvenli şekilde yönetir.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface UsersServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== INTERNAL TYPES ====================

/**
 * Users Query Builder Options
 * 
 * Veritabanı sorgusu oluşturmak için internal tip.
 * Model katmanında kullanılır.
 */
export interface UsersQueryOptions {
  limit: number;
  offset: number;
  search?: string;
  role?: string;
  is_active?: boolean;
  sort: string;
  sort_direction: 'asc' | 'desc';
}

/**
 * User Statistics
 * 
 * Kullanıcı istatistikleri için tip.
 * UserWithStats interface'ine ek olarak hesaplanabilir.
 */
export interface UserStatistics {
  comment_count: number;
  forum_post_count: number;
  forum_topic_count: number;
  unread_notifications: number;
  last_activity_at?: string;
}

/**
 * Users Filter Options
 * 
 * Kullanıcı filtreleme seçenekleri.
 * Frontend'de filter UI'ı için kullanılabilir.
 */
export interface UsersFilterOptions {
  roles: string[];           // Mevcut roller listesi
  active_count: number;      // Aktif kullanıcı sayısı
  inactive_count: number;    // Pasif kullanıcı sayısı
  total_count: number;       // Toplam kullanıcı sayısı
} 