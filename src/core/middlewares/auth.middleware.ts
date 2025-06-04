/**
 * Authentication Middleware Module
 * 
 * JWT token doğrulama ve kullanıcı yetkilendirme middleware'i.
 * Protected route'larda kullanıcının kimlik doğrulamasını yapar.
 * 
 */

import { Response, NextFunction } from 'express';
import { AuthService } from '@/features/auth/auth.service';
import { HTTP_STATUS } from '@/core/constants';
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token bulunamadı',
      });
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    // Token bilgilerini request'e ekle
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Token doğrulama hatası',
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
        message: 'Kimlik doğrulama gerekli',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok',
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
export const requireAdmin = requireRole(['admin']);

/**
 * Moderator Authorization Middleware
 * 
 * Moderator veya admin rolüne sahip kullanıcıların erişimine izin verir.
 */
export const requireModerator = requireRole(['moderator', 'admin']); 