/**
 * Reports Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { 
  createReportSchema,
  reviewReportSchema,
  bulkReportActionSchema,
  reportIdSchema,
  reportQuerySchema,
  CreateReportInput,
  ReviewReportInput,
  BulkReportActionInput,
  ReportQueryInput
} from './reports.validation';
import { 
  REPORT_ERROR_MESSAGES,
} from './reports.constants';
import { HTTP_STATUS } from '@/core/constants';
import { Request as AuthRequest } from '@/core/types';

/**
 * Reports Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class ReportsController {
  
  // ==================== REPORT CRUD ENDPOINTS ====================
  
  /**
   * Create Report Endpoint Handler
   * 
   * POST /api/reports
   * Yeni şikayet oluşturma işlemini yönetir.
   * Kullanıcı yetkisi gerektirir.
   * 
   * @param req - Express Request object (body: CreateReportRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async createReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = createReportSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const reportData: CreateReportInput = validationResult.data;
      const reporterId = req.user?.userId;

      if (!reporterId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await ReportsService.createReport(reportData, reporterId);

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
      console.error('Error in createReport controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Reports Endpoint Handler
   * 
   * GET /api/reports
   * Şikayetleri sayfalama ve filtreleme ile getirir.
   * Moderatör/Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (query: ReportQueryParams)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parameters validasyonu
      const validationResult = reportQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_QUERY_PARAMS,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const queryParams: ReportQueryInput = validationResult.data;

      // Servis katmanını çağır
      const result = await ReportsService.getReports(queryParams);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getReports controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Report by ID Endpoint Handler
   * 
   * GET /api/reports/:id
   * ID'ye göre şikayeti getirir.
   * Moderatör/Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getReportById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = reportIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_REPORT_ID,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = validationResult.data;

      // Servis katmanını çağır
      const result = await ReportsService.getReportById(id);

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
      console.error('Error in getReportById controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Review Report Endpoint Handler
   * 
   * PUT /api/reports/:id/review
   * Şikayeti değerlendirir.
   * Moderatör/Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: ReviewReportRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async reviewReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const paramsValidation = reportIdSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_REPORT_ID,
        });
        return;
      }

      // Request body validasyonu
      const bodyValidation = reviewReportSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = paramsValidation.data;
      const reviewData: ReviewReportInput = bodyValidation.data;
      const reviewerId = req.user?.userId;
      const reviewerRole = req.user?.role;

      if (!reviewerId || !reviewerRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await ReportsService.reviewReport(id, reviewData, reviewerId, reviewerRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error === REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND 
          ? HTTP_STATUS.NOT_FOUND
          : result.error === REPORT_ERROR_MESSAGES.REVIEW_PERMISSION_REQUIRED
          ? HTTP_STATUS.FORBIDDEN
          : HTTP_STATUS.BAD_REQUEST;

        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in reviewReport controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Delete Report Endpoint Handler
   * 
   * DELETE /api/reports/:id
   * Şikayeti siler.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async deleteReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = reportIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_REPORT_ID,
        });
        return;
      }

      const { id } = validationResult.data;
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await ReportsService.deleteReport(id, userRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error === REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND 
          ? HTTP_STATUS.NOT_FOUND
          : result.error === REPORT_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS
          ? HTTP_STATUS.FORBIDDEN
          : HTTP_STATUS.BAD_REQUEST;

        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in deleteReport controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk Report Action Endpoint Handler
   * 
   * POST /api/reports/bulk-action
   * Toplu şikayet işlemi yapar.
   * Moderatör/Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (body: BulkReportActionRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async bulkReportAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = bulkReportActionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const actionData: BulkReportActionInput = validationResult.data;
      const reviewerId = req.user?.userId;
      const reviewerRole = req.user?.role;

      if (!reviewerId || !reviewerRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await ReportsService.bulkReportAction(actionData, reviewerId, reviewerRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error === REPORT_ERROR_MESSAGES.REVIEW_PERMISSION_REQUIRED
          ? HTTP_STATUS.FORBIDDEN
          : HTTP_STATUS.BAD_REQUEST;

        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in bulkReportAction controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get Report Statistics Endpoint Handler
   * 
   * GET /api/reports/statistics
   * Şikayet istatistiklerini getirir.
   * Moderatör/Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getReportStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: REPORT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await ReportsService.getReportStatistics(userRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
        });
      } else {
        const statusCode = result.error === REPORT_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS
          ? HTTP_STATUS.FORBIDDEN
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;

        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getReportStatistics controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 