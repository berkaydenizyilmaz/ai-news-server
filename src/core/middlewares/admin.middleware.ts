/**
 * Admin Authorization Middleware
 * 
 * Admin yetkisi gerektiren endpoint'ler için yetkilendirme kontrolü yapar.
 * Auth middleware'den sonra çalışmalıdır.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@/core/constants';

/**
 * Admin Only Middleware
 * 
 * Kullanıcının admin rolüne sahip olup olmadığını kontrol eder.
 * Auth middleware'den sonra çalışmalıdır.
 * 
 * @param req - Express Request object (user: TokenPayload from auth middleware)
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns {void}
 */
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Auth middleware'den gelen user bilgisi
    const user = (req as any).user;

    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
      });
      return;
    }

    // Admin rolü kontrolü
    if (user.role !== 'admin') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli',
      });
      return;
    }

    // Admin yetkisi var, devam et
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Yetkilendirme kontrolü sırasında bir hata oluştu',
    });
  }
}; 