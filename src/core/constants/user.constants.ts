/**
 * User Constants
 * 
 * Kullanıcı rolleri, durumları ve kullanıcı yönetimi ile ilgili sabit değerler.
 * Authentication ve authorization işlemlerinde kullanılır.
 * 
 */

// ==================== USER ROLES ====================

/**
 * User Roles
 * Sistem kullanıcı rolleri - yetki seviyelerine göre sıralı
 */
export const USER_ROLES = {
  VISITOR: 'visitor',     // Misafir kullanıcı - en düşük yetki
  USER: 'user',          // Normal kullanıcı - temel yetkiler
  MODERATOR: 'moderator', // Moderatör - orta seviye yetkiler
  ADMIN: 'admin',        // Admin - en yüksek yetki
} as const;

/**
 * User Role Hierarchy
 * Rol hiyerarşisi - yetki seviyelerine göre sayısal değerler
 */
export const USER_ROLE_HIERARCHY = {
  [USER_ROLES.VISITOR]: 0,
  [USER_ROLES.USER]: 1,
  [USER_ROLES.MODERATOR]: 2,
  [USER_ROLES.ADMIN]: 3,
} as const;

// ==================== USER STATUS ====================

/**
 * User Status
 * Kullanıcı hesap durumları
 */
export const USER_STATUS = {
  ACTIVE: 'active',       // Aktif hesap
  INACTIVE: 'inactive',   // Pasif hesap
  SUSPENDED: 'suspended', // Askıya alınmış hesap
  BANNED: 'banned',       // Yasaklanmış hesap
  PENDING: 'pending',     // Onay bekleyen hesap
} as const;