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

// ==================== USER PERMISSIONS ====================

/**
 * User Permissions
 * Sistem yetkileri
 */
export const USER_PERMISSIONS = {
  // Content Management
  CREATE_CONTENT: 'create_content',
  EDIT_CONTENT: 'edit_content',
  DELETE_CONTENT: 'delete_content',
  PUBLISH_CONTENT: 'publish_content',
  
  // User Management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ROLES: 'manage_roles',
  
  // System Management
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs',
  MANAGE_RSS: 'manage_rss',
  MANAGE_AI: 'manage_ai',
  
  // Moderation
  MODERATE_COMMENTS: 'moderate_comments',
  MODERATE_POSTS: 'moderate_posts',
  BAN_USERS: 'ban_users',
} as const;

// ==================== ROLE PERMISSIONS MAPPING ====================

/**
 * Role Permissions Mapping
 * Her rol için izin verilen yetkiler
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.VISITOR]: [],
  
  [USER_ROLES.USER]: [
    USER_PERMISSIONS.CREATE_CONTENT,
  ],
  
  [USER_ROLES.MODERATOR]: [
    USER_PERMISSIONS.CREATE_CONTENT,
    USER_PERMISSIONS.EDIT_CONTENT,
    USER_PERMISSIONS.MODERATE_COMMENTS,
    USER_PERMISSIONS.MODERATE_POSTS,
    USER_PERMISSIONS.VIEW_USERS,
  ],
  
  [USER_ROLES.ADMIN]: [
    // Admin tüm yetkilere sahip
    ...Object.values(USER_PERMISSIONS),
  ],
} as const; 