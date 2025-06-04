/**
 * Authentication Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';

// ==================== VALIDATION CONSTANTS ====================

// Şifre ve kullanıcı adı için minimum/maksimum değerler
const PASSWORD_MIN_LENGTH = 6;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;

// ==================== VALIDATION SCHEMAS ====================

/**
 * User Registration Validation Schema
 * 
 * Yeni kullanıcı kaydı için validasyon kuralları:
 * - Email: Geçerli email formatı, zorunlu
 * - Password: Minimum 6 karakter, zorunlu
 * - Username: 3-50 karakter, sadece harf/rakam, zorunlu
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .min(1, 'Email adresi zorunludur'),
  
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
    .min(1, 'Şifre zorunludur'),
  
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH, `Kullanıcı adı en az ${USERNAME_MIN_LENGTH} karakter olmalıdır`)
    .max(USERNAME_MAX_LENGTH, `Kullanıcı adı en fazla ${USERNAME_MAX_LENGTH} karakter olmalıdır`)
    .regex(/^[a-zA-Z0-9]+$/, 'Kullanıcı adı sadece harf ve rakam içerebilir')
    .min(1, 'Kullanıcı adı zorunludur'),
});

/**
 * User Login Validation Schema
 * 
 * Kullanıcı girişi için validasyon kuralları:
 * - Email: Geçerli email formatı, zorunlu
 * - Password: Zorunlu (uzunluk kontrolü login'de yapılmaz)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .min(1, 'Email adresi zorunludur'),
  
  password: z
    .string()
    .min(1, 'Şifre zorunludur'),
});

/**
 * Change Password Validation Schema
 * 
 * Şifre değiştirme için validasyon kuralları:
 * - Current Password: Mevcut şifre, zorunlu
 * - New Password: Yeni şifre, minimum 6 karakter, zorunlu
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mevcut şifre zorunludur'),
  
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Yeni şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
    .min(1, 'Yeni şifre zorunludur'),
});

/**
 * Forgot Password Validation Schema
 * 
 * Şifre sıfırlama talebi için validasyon kuralları:
 * - Email: Geçerli email formatı, zorunlu
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .min(1, 'Email adresi zorunludur'),
});

/**
 * Reset Password Validation Schema
 * 
 * Şifre sıfırlama işlemi için validasyon kuralları:
 * - Token: Reset token'ı, zorunlu
 * - New Password: Yeni şifre, minimum 6 karakter, zorunlu
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token zorunludur'),
  
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
    .min(1, 'Şifre zorunludur'),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>; 