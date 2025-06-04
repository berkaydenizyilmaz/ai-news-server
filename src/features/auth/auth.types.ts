/**
 * Authentication Feature Type Definitions
 * 
 * Auth modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve JWT payload'ları.
 * 
 */

import { User } from '@/core/types/database.types';

// ==================== AUTH REQUEST DTOs ====================

/**
 * User Registration Request DTO
 * 
 * Yeni kullanıcı kaydı için gerekli veriler.
 * Frontend'den gelen kayıt formunun tipi.
 */
export interface RegisterRequest {
  email: string;    // Kullanıcı email adresi (unique)
  password: string; // Ham şifre (hash'lenmeden önce)
  username: string; // Kullanıcı adı (unique, alphanumeric)
}

/**
 * User Login Request DTO
 * 
 * Kullanıcı girişi için gerekli veriler.
 * Frontend'den gelen login formunun tipi.
 */
export interface LoginRequest {
  email: string;    // Kayıtlı email adresi
  password: string; // Ham şifre
}

/**
 * Change Password Request DTO
 * 
 * Şifre değiştirme işlemi için gerekli veriler.
 * Güvenlik için mevcut şifre de istenir.
 */
export interface ChangePasswordRequest {
  currentPassword: string; // Mevcut şifre (doğrulama için)
  newPassword: string;     // Yeni şifre
}

/**
 * Forgot Password Request DTO
 * 
 * Şifre sıfırlama talebi için gerekli veriler.
 * Email ile reset linki gönderilir.
 */
export interface ForgotPasswordRequest {
  email: string; // Reset linki gönderilecek email
}

/**
 * Reset Password Request DTO
 * 
 * Şifre sıfırlama işlemi için gerekli veriler.
 * Email'den gelen token ile yeni şifre belirlenir.
 */
export interface ResetPasswordRequest {
  token: string;       // Email'den gelen reset token'ı
  newPassword: string; // Yeni şifre
}

// ==================== AUTH RESPONSE DTOs ====================

/**
 * Authentication Success Response DTO
 * 
 * Başarılı login/register işlemlerinin dönüş tipi.
 * Kullanıcı bilgileri ve JWT token içerir.
 */
export interface AuthResponse {
  user: Omit<User, 'password_hash'>; // Şifre hash'i olmadan kullanıcı bilgileri
  token: string;                     // JWT access token
}

/**
 * JWT Token Payload Interface
 * 
 * JWT token içinde saklanan kullanıcı bilgileri.
 * Token decode edildiğinde bu yapı elde edilir.
 */
export interface TokenPayload {
  userId: string; // Kullanıcı ID'si
  email: string;  // Kullanıcı email'i
  role: string;   // Kullanıcı rolü (user, moderator, admin)
  iat?: number;   // Token issued at (Unix timestamp)
  exp?: number;   // Token expires at (Unix timestamp)
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Auth Service Response Interface
 * 
 * Tüm auth servis metodlarının standart dönüş tipi.
 * Success/error durumlarını tip güvenli şekilde yönetir.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface AuthServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
} 