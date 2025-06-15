/**
 * Authentication Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';
import { 
  PASSWORD_CONSTRAINTS, 
  USERNAME_CONSTRAINTS, 
  VALIDATION_MESSAGES 
} from './auth.constants';

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
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED),
  
  password: z
    .string()
    .min(PASSWORD_CONSTRAINTS.MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
    .max(PASSWORD_CONSTRAINTS.MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH)
    .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
  
  username: z
    .string()
    .min(USERNAME_CONSTRAINTS.MIN_LENGTH, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH)
    .max(USERNAME_CONSTRAINTS.MAX_LENGTH, VALIDATION_MESSAGES.USERNAME_MAX_LENGTH)
    .regex(USERNAME_CONSTRAINTS.REGEX, VALIDATION_MESSAGES.USERNAME_INVALID_CHARS)
    .min(1, VALIDATION_MESSAGES.USERNAME_REQUIRED),
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
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED),
  
  password: z
    .string()
    .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
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
    .min(1, VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED),
  
  newPassword: z
    .string()
    .min(PASSWORD_CONSTRAINTS.MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
    .max(PASSWORD_CONSTRAINTS.MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH)
    .min(1, VALIDATION_MESSAGES.NEW_PASSWORD_REQUIRED),
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
    .email(VALIDATION_MESSAGES.EMAIL_INVALID)
    .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED),
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
    .min(1, VALIDATION_MESSAGES.RESET_TOKEN_REQUIRED),
  
  newPassword: z
    .string()
    .min(PASSWORD_CONSTRAINTS.MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
    .max(PASSWORD_CONSTRAINTS.MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_MAX_LENGTH)
    .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
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