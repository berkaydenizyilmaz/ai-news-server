/**
 * Settings Feature HTTP Controller
 * 
 * HTTP isteklerini karşılar, validasyon yapar ve servis katmanını çağırır.
 * Request/Response nesnelerini yönetir ve HTTP status kodlarını belirler.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { 
  createSettingSchema, 
  updateSettingSchema, 
  bulkUpdateSettingsSchema,
  settingsFilterSchema,
  CreateSettingInput,
  UpdateSettingInput,
  BulkUpdateSettingsInput,
  SettingsFilterInput
} from './settings.validation';
import { HTTP_STATUS } from '@/core/constants';

/**
 * Settings Controller Class
 * 
 * Static metodlarla HTTP endpoint'lerini yönetir.
 * Express middleware pattern'ini takip eder.
 */
export class SettingsController {
  
  // ==================== SETTING CREATION ====================
  
  /**
   * Create Setting Endpoint Handler
   * 
   * POST /api/settings
   * Yeni sistem ayarı oluşturma işlemini yönetir.
   * 
   * @param req - Express Request object (body: CreateSettingRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async createSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = createSettingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz veri formatı',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const settingData: CreateSettingInput = validationResult.data;

      // Servis katmanını çağır
      const result = await SettingsService.createSetting(settingData);

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
      console.error('Error in createSetting controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== SETTING RETRIEVAL ====================

  /**
   * Get All Settings Endpoint Handler
   * 
   * GET /api/settings
   * Tüm sistem ayarlarını getirme işlemini yönetir.
   * 
   * @param req - Express Request object (query: filters)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getAllSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametreleri validasyonu
      const validationResult = settingsFilterSchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz filtre parametreleri',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const filters: SettingsFilterInput = validationResult.data;

      // Servis katmanını çağır
      const result = await SettingsService.getAllSettings(filters);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getAllSettings controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Setting by Key Endpoint Handler
   * 
   * GET /api/settings/:key
   * Tek bir ayarı anahtarına göre getirme işlemini yönetir.
   * 
   * @param req - Express Request object (params: key)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getSettingByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Ayar anahtarı gereklidir',
        });
        return;
      }

      // Servis katmanını çağır
      const result = await SettingsService.getSettingByKey(key);

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
      console.error('Error in getSettingByKey controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get Settings by Category Endpoint Handler
   * 
   * GET /api/settings/category/:category
   * Kategoriye göre ayarları getirme işlemini yönetir.
   * 
   * @param req - Express Request object (params: category)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getSettingsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;

      if (!category) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Kategori gereklidir',
        });
        return;
      }

      // Servis katmanını çağır
      const result = await SettingsService.getSettingsByCategory(category);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in getSettingsByCategory controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== SETTING UPDATE ====================

  /**
   * Update Setting Endpoint Handler
   * 
   * PUT /api/settings/:key
   * Mevcut ayarı güncelleme işlemini yönetir.
   * 
   * @param req - Express Request object (params: key, body: UpdateSettingRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Ayar anahtarı gereklidir',
        });
        return;
      }

      // Request body validasyonu
      const validationResult = updateSettingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz veri formatı',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const updateData: UpdateSettingInput = validationResult.data;

      // Servis katmanını çağır
      const result = await SettingsService.updateSetting(key, updateData);

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
      console.error('Error in updateSetting controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Bulk Update Settings Endpoint Handler
   * 
   * PUT /api/settings/bulk
   * Birden fazla ayarı güncelleme işlemini yönetir.
   * 
   * @param req - Express Request object (body: BulkUpdateSettingsRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async bulkUpdateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Request body validasyonu
      const validationResult = bulkUpdateSettingsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz veri formatı',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const bulkData: BulkUpdateSettingsInput = validationResult.data;

      // Servis katmanını çağır
      const result = await SettingsService.bulkUpdateSettings(bulkData);

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
      console.error('Error in bulkUpdateSettings controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== SETTING DELETION ====================

  /**
   * Delete Setting Endpoint Handler
   * 
   * DELETE /api/settings/:key
   * Ayar silme işlemini yönetir.
   * 
   * @param req - Express Request object (params: key)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async deleteSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Ayar anahtarı gereklidir',
        });
        return;
      }

      // Servis katmanını çağır
      const result = await SettingsService.deleteSetting(key);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Error in deleteSetting controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 