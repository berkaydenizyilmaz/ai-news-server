/**
 * Log Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { LogService } from './log.service';
import { 
  createLogSchema, 
  getLogsQuerySchema, 
  logIdParamSchema,
  CreateLogInput,
  GetLogsQueryInput,
  LogIdParamInput
} from './log.validation';
import { HTTP_STATUS } from '@/core/constants';
import { 
  LOG_VALIDATION_MESSAGES, 
  LOG_ERROR_MESSAGES, 
  DATE_CONSTRAINTS 
} from './log.constants';

/**
 * Log Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class LogController {

  // ==================== LOG CREATION ====================

  /**
   * Create Log Endpoint Handler
   * 
   * POST /api/logs
   * Frontend'den gelen log verisini alır ve veritabanına kaydeder.
   * 
   * @param req - Express Request object (body: CreateLogRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async createLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = createLogSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: LOG_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const logData: CreateLogInput = validationResult.data;

      // Request bilgilerini al
      const userId = (req as any).user?.userId;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const requestId = req.get('X-Request-ID');

      // Servis katmanını çağır
      const result = await LogService.createLog(
        logData,
        userId,
        ipAddress,
        userAgent,
        requestId
      );

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
      console.error('Error in createLog controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== LOG LISTING ====================

  /**
   * Get Logs Endpoint Handler
   * 
   * GET /api/logs
   * Filtreleme ve sayfalama parametreleriyle log listesini getirir.
   * 
   * @param req - Express Request object (query: GetLogsQuery)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametreleri validasyonu
      const validationResult = getLogsQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: LOG_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const query: GetLogsQueryInput = validationResult.data;

      // Kullanıcı rolünü kontrol et
      const isAdmin = (req as any).user?.role === 'admin';

      // Servis katmanını çağır
      const result = await LogService.getLogs(query, isAdmin);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
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
      console.error('Error in getLogs controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== SINGLE LOG RETRIEVAL ====================

  /**
   * Get Log by ID Endpoint Handler
   * 
   * GET /api/logs/:id
   * ID'ye göre tek bir log kaydını getirir.
   * 
   * @param req - Express Request object (params: { id })
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametresi validasyonu
      const validationResult = logIdParamSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: LOG_VALIDATION_MESSAGES.INVALID_LOG_ID,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id }: LogIdParamInput = validationResult.data;

      // Kullanıcı rolünü kontrol et
      const isAdmin = (req as any).user?.role === 'admin';

      // Servis katmanını çağır
      const result = await LogService.getLogById(id, isAdmin);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error?.includes('bulunamadı') 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.BAD_REQUEST;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getLogById controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== LOG STATISTICS ====================

  /**
   * Get Log Statistics Endpoint Handler
   * 
   * GET /api/logs/stats
   * Admin paneli için log istatistiklerini getirir.
   * Sadece admin kullanıcılar erişebilir.
   * 
   * @param req - Express Request object (query: { days? })
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getLogStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Admin yetkisi kontrolü
      if ((req as any).user?.role !== 'admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: LOG_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Days parametresini al (opsiyonel)
      const days = req.query.days ? parseInt(req.query.days as string, 10) : DATE_CONSTRAINTS.DEFAULT_STATS_DAYS;

      // Servis katmanını çağır
      const result = await LogService.getLogStats(days);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
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
      console.error('Error in getLogStats controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER LOGS ====================

  /**
   * Get User Logs Endpoint Handler
   * 
   * GET /api/logs/user/:userId
   * Belirli bir kullanıcının log kayıtlarını getirir.
   * Kullanıcı kendi loglarını görebilir, admin tüm logları görebilir.
   * 
   * @param req - Express Request object (params: { userId }, query: GetLogsQuery)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getUserLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametresi validasyonu
      const userIdValidation = logIdParamSchema.safeParse({ id: req.params.userId });
      
      if (!userIdValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: LOG_VALIDATION_MESSAGES.INVALID_USER_ID,
          errors: userIdValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const userId = req.params.userId;

      // Query parametreleri validasyonu
      const queryValidation = getLogsQuerySchema.safeParse(req.query);
      
      if (!queryValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: LOG_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: queryValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const query: GetLogsQueryInput = queryValidation.data;

      // Kullanıcı bilgilerini al
      const requestingUserId = (req as any).user?.userId;
      const isAdmin = (req as any).user?.role === 'admin';

      // Servis katmanını çağır
      const result = await LogService.getUserLogs(
        userId,
        query,
        requestingUserId,
        isAdmin
      );

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error?.includes('yetkiniz') 
          ? HTTP_STATUS.FORBIDDEN 
          : HTTP_STATUS.BAD_REQUEST;
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getUserLogs controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== LOG CLEANUP ====================

  /**
   * Clean Old Logs Endpoint Handler
   * 
   * DELETE /api/logs/cleanup
   * Belirtilen günden eski log kayıtlarını siler.
   * Sadece admin kullanıcılar erişebilir.
   * 
   * @param req - Express Request object (body: { days? })
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async cleanOldLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Admin yetkisi kontrolü
      if ((req as any).user?.role !== 'admin') {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: LOG_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Days parametresini al
      const days = req.body.days ? parseInt(req.body.days, 10) : DATE_CONSTRAINTS.DEFAULT_CLEANUP_DAYS;

      // Servis katmanını çağır
      const result = await LogService.cleanOldLogs(days);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
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
      console.error('Error in cleanOldLogs controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 