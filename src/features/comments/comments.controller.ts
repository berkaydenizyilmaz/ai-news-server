/**
 * Comments Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { CommentsService } from './comments.service';
import { 
  createCommentSchema,
  updateCommentSchema,
  commentIdSchema,
  commentQuerySchema,
  bulkModerationSchema,
  CreateCommentInput,
  UpdateCommentInput,
  CommentQueryInput,
  BulkModerationInput
} from './comments.validation';
import { 
  COMMENT_ERROR_MESSAGES,
} from './comments.constants';
import { HTTP_STATUS } from '@/core/constants';
import { Request as AuthRequest } from '@/core/types';

/**
 * Comments Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class CommentsController {
  
  // ==================== COMMENT CRUD ENDPOINTS ====================
  
  /**
   * Create Comment Endpoint Handler
   * 
   * POST /api/comments
   * Yeni yorum oluşturma işlemini yönetir.
   * Kullanıcı girişi gerektirir.
   * 
   * @param req - Express Request object (body: CreateCommentRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async createComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = createCommentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const commentData: CreateCommentInput = validationResult.data;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await CommentsService.createComment(commentData, userId, userRole);

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
      console.error('Error in createComment controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Comments for News Endpoint Handler
   * 
   * GET /api/comments/news/:newsId
   * Belirli bir haberin yorumlarını sayfalama ile getirir.
   * 
   * @param req - Express Request object (params: {newsId}, query: CommentQueryParams)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getCommentsForNews(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parameters + params validasyonu
      const queryValidation = commentQuerySchema.safeParse({
        ...req.query,
        processed_news_id: req.params.newsId,
      });
      
      if (!queryValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: queryValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const queryParams: CommentQueryInput = queryValidation.data;
      const userRole = req.user?.role;

      // Servis katmanını çağır
      const result = await CommentsService.getCommentsForNews(queryParams, userRole);

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
      console.error('Error in getCommentsForNews controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Comment by ID Endpoint Handler
   * 
   * GET /api/comments/:id
   * ID'ye göre yorum getirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getCommentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = commentIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = validationResult.data;
      const userRole = req.user?.role;

      // Servis katmanını çağır
      const result = await CommentsService.getCommentById(id, userRole);

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
      console.error('Error in getCommentById controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Update Comment Endpoint Handler
   * 
   * PUT /api/comments/:id
   * Yorumu güncelleme işlemini yönetir.
   * Kullanıcı girişi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: UpdateCommentRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const paramsValidation = commentIdSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: paramsValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      // Request body validasyonu
      const bodyValidation = updateCommentSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = paramsValidation.data;
      const updateData: UpdateCommentInput = bodyValidation.data;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await CommentsService.updateComment(id, updateData, userId, userRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        const statusCode = result.error === COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.BAD_REQUEST;
          
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in updateComment controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Delete Comment Endpoint Handler
   * 
   * DELETE /api/comments/:id
   * Yorumu silme işlemini yönetir (soft delete).
   * Kullanıcı girişi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async deleteComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = commentIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = validationResult.data;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await CommentsService.deleteComment(id, userId, userRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error === COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.BAD_REQUEST;
          
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in deleteComment controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== MODERATION ENDPOINTS ====================

  /**
   * Bulk Moderation Endpoint Handler
   * 
   * POST /api/comments/moderate
   * Toplu moderasyon işlemini yönetir.
   * Moderatör/admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (body: BulkModerationRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async bulkModeration(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = bulkModerationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.VALIDATION_FAILED,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const moderationData: BulkModerationInput = validationResult.data;
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await CommentsService.bulkModeration(moderationData, userRole);

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
      console.error('Error in bulkModeration controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== STATISTICS ENDPOINTS ====================

  /**
   * Get Comment Statistics Endpoint Handler
   * 
   * GET /api/comments/statistics
   * Yorum istatistiklerini getirir.
   * Moderatör/admin yetkisi gerektirir.
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getCommentStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await CommentsService.getCommentStatistics(userRole);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getCommentStatistics controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 