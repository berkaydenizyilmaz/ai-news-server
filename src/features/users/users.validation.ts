/**
 * Users Feature Validation Schemas
 * 
 * Zod kütüphanesi ile oluşturulan validasyon şemaları.
 * Users API endpoint'lerine gelen verilerin doğrulanması için kullanılır.
 * 
 */

import { z } from 'zod';
import { 
  USERS_QUERY_CONSTRAINTS,
  USERS_SEARCH_CONSTRAINTS,
  USERS_SORT_OPTIONS,
  USERS_SORT_DIRECTIONS,
  USERS_VALIDATION_MESSAGES,
  USER_ROLES
} from './users.constants';
import { 
  USERNAME_CONSTRAINTS,
  EMAIL_CONSTRAINTS
} from '@/core/constants';

// ==================== QUERY VALIDATION SCHEMAS ====================

/**
 * Get Users Query Validation Schema
 * 
 * Kullanıcı listesi endpoint'i için query parametrelerinin validasyonu:
 * - Limit: 1-100 arası, opsiyonel
 * - Offset: 0 veya pozitif, opsiyonel
 * - Search: 2-50 karakter, opsiyonel
 * - Role: Geçerli rol değeri, opsiyonel
 * - is_active: Boolean, opsiyonel
 * - Sort: Geçerli sıralama alanı, opsiyonel
 * - Sort direction: asc/desc, opsiyonel
 */
export const getUsersQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : USERS_QUERY_CONSTRAINTS.DEFAULT_LIMIT)
    .refine((val) => val >= USERS_QUERY_CONSTRAINTS.MIN_LIMIT && val <= USERS_QUERY_CONSTRAINTS.MAX_LIMIT, {
      message: USERS_VALIDATION_MESSAGES.LIMIT_INVALID,
    }),
  
  offset: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : USERS_QUERY_CONSTRAINTS.DEFAULT_OFFSET)
    .refine((val) => val >= 0, {
      message: USERS_VALIDATION_MESSAGES.OFFSET_INVALID,
    }),
  
  search: z
    .string()
    .min(USERS_SEARCH_CONSTRAINTS.MIN_SEARCH_LENGTH, USERS_VALIDATION_MESSAGES.SEARCH_TOO_SHORT)
    .max(USERS_SEARCH_CONSTRAINTS.MAX_SEARCH_LENGTH, USERS_VALIDATION_MESSAGES.SEARCH_TOO_LONG)
    .optional(),
  
  role: z
    .enum([USER_ROLES.VISITOR, USER_ROLES.USER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN] as const)
    .optional(),
  
  is_active: z
    .string()
    .optional()
    .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined)
    .refine((val) => val === undefined || typeof val === 'boolean', {
      message: USERS_VALIDATION_MESSAGES.STATUS_INVALID,
    }),
  
  sort: z
    .enum([
      USERS_SORT_OPTIONS.CREATED_AT,
      USERS_SORT_OPTIONS.UPDATED_AT,
      USERS_SORT_OPTIONS.EMAIL,
      USERS_SORT_OPTIONS.USERNAME,
      USERS_SORT_OPTIONS.ROLE,
    ] as const)
    .optional()
    .default(USERS_SORT_OPTIONS.CREATED_AT),
  
  sort_direction: z
    .enum([USERS_SORT_DIRECTIONS.ASC, USERS_SORT_DIRECTIONS.DESC] as const)
    .optional()
    .default(USERS_SORT_DIRECTIONS.DESC),
});

// ==================== PARAMS VALIDATION SCHEMAS ====================

/**
 * User ID Params Validation Schema
 * 
 * URL parametrelerinde kullanıcı ID'si validasyonu:
 * - ID: UUID formatında, zorunlu
 */
export const userIdParamsSchema = z.object({
  id: z
    .string()
    .uuid(USERS_VALIDATION_MESSAGES.USER_ID_INVALID)
    .min(1, USERS_VALIDATION_MESSAGES.USER_ID_REQUIRED),
});

// ==================== BODY VALIDATION SCHEMAS ====================

/**
 * Update User Validation Schema
 * 
 * Kullanıcı güncelleme için validasyon kuralları:
 * - Email: Geçerli email formatı, opsiyonel
 * - Username: 3-50 karakter, sadece harf/rakam, opsiyonel
 * - Avatar URL: Geçerli URL formatı, opsiyonel
 * - Role: Geçerli rol değeri, opsiyonel
 * - is_active: Boolean, opsiyonel
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .optional(),
  
  username: z
    .string()
    .min(USERNAME_CONSTRAINTS.MIN_LENGTH, `Kullanıcı adı en az ${USERNAME_CONSTRAINTS.MIN_LENGTH} karakter olmalıdır`)
    .max(USERNAME_CONSTRAINTS.MAX_LENGTH, `Kullanıcı adı en fazla ${USERNAME_CONSTRAINTS.MAX_LENGTH} karakter olmalıdır`)
    .regex(USERNAME_CONSTRAINTS.REGEX, 'Kullanıcı adı sadece harf ve rakam içerebilir')
    .optional(),
  
  avatar_url: z
    .string()
    .url('Geçerli bir URL giriniz')
    .optional()
    .or(z.literal('')), // Boş string kabul et (avatar silme için)
  
  role: z
    .enum([USER_ROLES.VISITOR, USER_ROLES.USER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN] as const, {
      errorMap: () => ({ message: USERS_VALIDATION_MESSAGES.ROLE_INVALID }),
    })
    .optional(),
  
  is_active: z
    .boolean({
      errorMap: () => ({ message: USERS_VALIDATION_MESSAGES.STATUS_INVALID }),
    })
    .optional(),
});

/**
 * Update User Role Validation Schema
 * 
 * Kullanıcı rolü değiştirme için validasyon kuralları:
 * - Role: Geçerli rol değeri, zorunlu
 */
export const updateUserRoleSchema = z.object({
  role: z
    .enum([USER_ROLES.VISITOR, USER_ROLES.USER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN] as const, {
      errorMap: () => ({ message: USERS_VALIDATION_MESSAGES.ROLE_INVALID }),
    }),
});

/**
 * Update User Status Validation Schema
 * 
 * Kullanıcı durumu değiştirme için validasyon kuralları:
 * - is_active: Boolean, zorunlu
 */
export const updateUserStatusSchema = z.object({
  is_active: z
    .boolean({
      errorMap: () => ({ message: USERS_VALIDATION_MESSAGES.STATUS_INVALID }),
    }),
});

// ==================== TYPE INFERENCE ====================

/**
 * Zod Schema'larından Otomatik Tip Çıkarımı
 * 
 * Bu tipler, validation schema'larından otomatik olarak türetilir.
 * Schema değiştiğinde tipler de otomatik güncellenir.
 */
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>; 