/**
 * RSS Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { RssService } from './rss.service';
import { 
  createRssSourceSchema,
  updateRssSourceSchema,
  rssSourceIdSchema,
  rssSourceQuerySchema,
  rssFetchSchema,
  CreateRssSourceInput,
  UpdateRssSourceInput,
  RssSourceQueryInput,
  RssFetchInput
} from './rss.validation';
import { 
  RSS_ERROR_MESSAGES,
} from './rss.constants';
import { HTTP_STATUS } from '@/core/constants';

/**
 * RSS Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class RssController {
  
  // ==================== RSS SOURCE CRUD ENDPOINTS ====================
  
  /**
   * Create RSS Source Endpoint Handler
   * 
   * POST /api/rss/sources
   * Yeni RSS kaynağı oluşturma işlemini yönetir.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (body: CreateRssSourceRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async createRssSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = createRssSourceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const sourceData: CreateRssSourceInput = validationResult.data;
      const createdBy = (req as any).user?.userId;

      if (!createdBy) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: RSS_ERROR_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await RssService.createRssSource(sourceData, createdBy);

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
      console.error('Error in createRssSource controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get RSS Sources Endpoint Handler
   * 
   * GET /api/rss/sources
   * RSS kaynaklarını sayfalama ve filtreleme ile getirir.
   * 
   * @param req - Express Request object (query: RssSourceQueryParams)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getRssSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parameters validasyonu
      const validationResult = rssSourceQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_QUERY_PARAMS,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const queryParams: RssSourceQueryInput = validationResult.data;

      // Servis katmanını çağır
      const result = await RssService.getRssSources(queryParams);

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
      console.error('Error in getRssSources controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get RSS Source by ID Endpoint Handler
   * 
   * GET /api/rss/sources/:id
   * ID'ye göre RSS kaynağını getirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getRssSourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = rssSourceIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_SOURCE_ID,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = validationResult.data;

      // Servis katmanını çağır
      const result = await RssService.getRssSourceById(id);

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
      console.error('Error in getRssSourceById controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Update RSS Source Endpoint Handler
   * 
   * PUT /api/rss/sources/:id
   * RSS kaynağını günceller.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: UpdateRssSourceRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateRssSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const paramsValidation = rssSourceIdSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_SOURCE_ID,
        });
        return;
      }

      // Request body validasyonu
      const bodyValidation = updateRssSourceSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id } = paramsValidation.data;
      const updateData: UpdateRssSourceInput = bodyValidation.data;

      // Servis katmanını çağır
      const result = await RssService.updateRssSource(id, updateData);

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
      console.error('Error in updateRssSource controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Delete RSS Source Endpoint Handler
   * 
   * DELETE /api/rss/sources/:id
   * RSS kaynağını siler.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async deleteRssSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parameters validasyonu
      const validationResult = rssSourceIdSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_SOURCE_ID,
        });
        return;
      }

      const { id } = validationResult.data;

      // Servis katmanını çağır
      const result = await RssService.deleteRssSource(id);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error?.includes('bulunamadı') 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
          
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in deleteRssSource controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== RSS FEED OPERATIONS ====================

  /**
   * Fetch RSS Feeds Endpoint Handler
   * 
   * POST /api/rss/fetch
   * RSS kaynaklarından haberleri çeker.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (body: RssFetchRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async fetchRssFeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = rssFetchSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: RSS_ERROR_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const fetchParams: RssFetchInput = validationResult.data;

      // Servis katmanını çağır
      const result = await RssService.fetchRssFeeds(fetchParams);

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
      console.error('Error in fetchRssFeeds controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 