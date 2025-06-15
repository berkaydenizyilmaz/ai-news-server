/**
 * Authentication Middleware Module
 * 
 * JWT token doğrulama ve kullanıcı yetkilendirme middleware'i.
 * Protected route'larda kullanıcının kimlik doğrulamasını yapar.
 * 
 */

import { Response, NextFunction } from 'express';
import { AuthService } from '@/features/auth/auth.service';
import { 
  HTTP_STATUS, 
  USER_ROLES, 
  AUTH_ERROR_MESSAGES, 
  TOKEN_CONFIG 
} from '@/core/constants';
import { Request } from '@/core/types';

/**
 * Authentication Middleware
 * 
 * Request header'dan JWT token'ı alır ve doğrular.
 * Geçerli token varsa decoded payload'ı request nesnesine ekler.
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns void
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers[TOKEN_CONFIG.HEADER_NAME];
    
    if (!authHeader || !authHeader.startsWith(TOKEN_CONFIG.BEARER_PREFIX)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: AUTH_ERROR_MESSAGES.TOKEN_NOT_FOUND,
      });
    }

    const token = authHeader.substring(TOKEN_CONFIG.BEARER_PREFIX_LENGTH);
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: AUTH_ERROR_MESSAGES.INVALID_TOKEN,
      });
    }

    // Token bilgilerini request'e ekle
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: AUTH_ERROR_MESSAGES.TOKEN_VERIFICATION_FAILED,
    });
  }
};

// ==================== ROLE-BASED AUTHORIZATION ====================

/**
 * Role-Based Authorization Middleware Factory
 * 
 * Belirli rollere sahip kullanıcıların erişimine izin veren middleware üretir.
 * authMiddleware ile birlikte kullanılmalıdır.
 * 
 * @param roles - İzin verilen rollerin listesi
 * @returns {Function} Express middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: AUTH_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: AUTH_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      });
    }

    next();
  };
};

/**
 * Admin Authorization Middleware
 * 
 * Sadece admin rolüne sahip kullanıcıların erişimine izin verir.
 */
export const requireAdmin = requireRole([USER_ROLES.ADMIN]);

/**
 * Moderator Authorization Middleware
 * 
 * Moderator veya admin rolüne sahip kullanıcıların erişimine izin verir.
 */
export const requireModerator = requireRole([USER_ROLES.MODERATOR, USER_ROLES.ADMIN]); 