/**
 * Authentication Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  RegisterInput,
  LoginInput,
  ChangePasswordInput
} from './auth.validation';
import { 
  AUTH_SUCCESS_MESSAGES,
  VALIDATION_MESSAGES,
  AUTH_ERROR_MESSAGES 
} from './auth.constants';
import { HTTP_STATUS } from '@/core/constants';

/**
 * Authentication Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class AuthController {
  
  // ==================== USER REGISTRATION ====================
  
  /**
   * User Registration Endpoint Handler
   * 
   * POST /api/auth/register
   * Yeni kullanıcı kaydı işlemini yönetir.
   * 
   * @param req - Express Request object (body: RegisterRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = registerSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const userData: RegisterInput = validationResult.data;

      // Servis katmanını çağır
      const result = await AuthService.register(userData);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in register controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER LOGIN ====================

  /**
   * User Login Endpoint Handler
   * 
   * POST /api/auth/login
   * Kullanıcı giriş işlemini yönetir.
   * 
   * @param req - Express Request object (body: LoginRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = loginSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const credentials: LoginInput = validationResult.data;

      // Servis katmanını çağır
      const result = await AuthService.login(credentials);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in login controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER LOGOUT ====================

  /**
   * User Logout Endpoint Handler
   * 
   * POST /api/auth/logout
   * Kullanıcı çıkış işlemini yönetir. JWT stateless olduğu için
   * sadece başarılı response döner, client-side'da token silinir.
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // JWT stateless olduğu için server-side'da yapılacak bir şey yok
      // Client-side'da token silinmeli
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: AUTH_SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error) {
      console.error('Error in logout controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER PROFILE ====================

  /**
   * Get User Profile Endpoint Handler
   * 
   * GET /api/auth/profile
   * Giriş yapmış kullanıcının profil bilgilerini döner.
   * Auth middleware ile korunmalıdır.
   * 
   * @param req - Express Request object (user: TokenPayload from middleware)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Auth middleware'den gelen user bilgisi
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await AuthService.getProfile(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getProfile controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== PASSWORD CHANGE ====================

  /**
   * Change Password Endpoint Handler
   * 
   * PUT /api/auth/change-password
   * Kullanıcının şifre değiştirme işlemini yönetir.
   * Auth middleware ile korunmalıdır.
   * 
   * @param req - Express Request object (body: ChangePasswordRequest, user: TokenPayload)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Auth middleware'den gelen user bilgisi
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Request body validasyonu
      const validationResult = changePasswordSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const passwordData: ChangePasswordInput = validationResult.data;

      // Servis katmanını çağır
      const result = await AuthService.changePassword(userId, passwordData);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in changePassword controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== TOKEN VERIFICATION ====================

  /**
   * Verify Token Endpoint Handler
   * 
   * GET /api/auth/verify
   * JWT token'ın geçerliliğini kontrol eder.
   * Auth middleware ile korunmalıdır.
   * 
   * @param req - Express Request object (user: TokenPayload from middleware)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Auth middleware'den gelen user bilgisi
      const user = (req as any).user;

      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Geçersiz token',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          userId: user.userId,
          email: user.email,
          role: user.role,
        },
        message: 'Token geçerli',
      });
    } catch (error) {
      console.error('Error in verifyToken controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 