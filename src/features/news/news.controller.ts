/**
 * News Feature HTTP Request Handler
 * 
 * News modülü için HTTP isteklerini yönetir.
 * Request/Response işlemleri ve validasyon kontrolü.
 */

import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service';
import { 
  CreateNewsSchema, 
  UpdateNewsSchema, 
  NewsQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
  NewsGenerationSchema,
  BulkNewsOperationSchema
} from './news.validation';
import { 
  NEWS_ERROR_MESSAGES,
  NEWS_SUCCESS_MESSAGES 
} from './news.constants';
import { HTTP_STATUS } from '@/core/constants/http.constants';

/**
 * News Controller Class
 * 
 * Static metodlarla news HTTP isteklerini yönetir.
 * Express Request/Response objelerini kullanır.
 */
export class NewsController {
  
  // ==================== PROCESSED NEWS ENDPOINTS ====================
  
  /**
   * Create Processed News
   * POST /api/v1/news
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async createProcessedNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validasyon
      const validationResult = CreateNewsSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.createProcessedNews(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.CREATED : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Processed News List
   * GET /api/v1/news
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getProcessedNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametrelerini parse et
      const queryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        category_id: req.query.category_id as string,
        status: req.query.status as any,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'desc',
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
      };

      // Validasyon
      const validationResult = NewsQuerySchema.safeParse(queryParams);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.getProcessedNews(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Processed News by ID
   * GET /api/v1/news/:id
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getProcessedNewsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // UUID veya slug kontrolü
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(id);
      
      let result;
      if (isUuid) {
        // UUID ile ara
        result = await NewsService.getProcessedNewsById(id);
      } else {
        // Slug ile ara
        result = await NewsService.getProcessedNewsBySlug(id);
      }

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.NOT_FOUND;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Processed News
   * PUT /api/v1/news/:id
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async updateProcessedNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // UUID validasyonu
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
        });
        return;
      }

      // Validasyon
      const validationResult = UpdateNewsSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.updateProcessedNews(id, validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Processed News
   * DELETE /api/v1/news/:id
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async deleteProcessedNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // UUID validasyonu
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.deleteProcessedNews(id);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== NEWS CATEGORIES ENDPOINTS ====================

  /**
   * Create News Category
   * POST /api/v1/news/categories
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async createNewsCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validasyon
      const validationResult = CreateCategorySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.createCategory(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.CREATED : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get News Categories List
   * GET /api/v1/news/categories
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getNewsCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametrelerini parse et
      const queryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        sort_by: req.query.sort_by as any || 'name',
        sort_order: req.query.sort_order as any || 'asc',
      };

      // Validasyon
      const validationResult = CategoryQuerySchema.safeParse(queryParams);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.getNewsCategories(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update News Category
   * PUT /api/v1/news/categories/:id
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async updateNewsCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // UUID validasyonu
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
        });
        return;
      }

      // Validasyon
      const validationResult = UpdateCategorySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.updateNewsCategory(id, validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete News Category
   * DELETE /api/v1/news/categories/:id
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async deleteNewsCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // UUID validasyonu
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.deleteNewsCategory(id);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== AI NEWS GENERATION ENDPOINTS ====================

  /**
   * Generate News from RSS
   * POST /api/v1/news/generate
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async generateNewsFromRSS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validasyon
      const validationResult = NewsGenerationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.generateNewsFromRSS(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process Multiple RSS News
   * POST /api/v1/news/process-batch
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async processMultipleRSSNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { original_news_ids, available_categories } = req.body;

      // Basit validasyon
      if (!Array.isArray(original_news_ids) || !Array.isArray(available_categories)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.processMultipleRSSNews(original_news_ids, available_categories);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== BULK OPERATIONS ENDPOINTS ====================

  /**
   * Bulk News Operations
   * POST /api/v1/news/bulk
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async bulkNewsOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validasyon
      const validationResult = BulkNewsOperationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: NEWS_ERROR_MESSAGES.INVALID_REQUEST,
          details: validationResult.error.errors,
        });
        return;
      }

      // Servis çağrısı
      const result = await NewsService.bulkNewsOperation(validationResult.data);

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATISTICS ENDPOINTS ====================

  /**
   * Get News Statistics
   * GET /api/v1/news/statistics
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getNewsStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Servis çağrısı
      const result = await NewsService.getNewsStatistics();

      // Yanıt
      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }
} 