/**
 * Users Feature Controller Layer
 * 
 * Users modülü için HTTP request/response işlemlerini yönetir.
 * API endpoint'lerini tanımlar ve servis katmanını çağırır.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { 
  getUsersQuerySchema,
  userIdParamsSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  GetUsersQueryInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput
} from './users.validation';
import { 
  USERS_VALIDATION_MESSAGES,
  USERS_ERROR_MESSAGES
} from './users.constants';
import { HTTP_STATUS } from '@/core/constants';

/**
 * Users Controller Class
 * 
 * Static metodlarla users endpoint'lerinin HTTP işlemlerini yönetir.
 * Request validation, servis çağırma ve response oluşturma.
 */
export class UsersController {

  // ==================== USER LISTING ====================

  /**
   * Get Users List Endpoint Handler
   * 
   * GET /api/users
   * Kullanıcı listesini pagination ve filtering ile getirir.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (query: GetUsersQuery)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query parametrelerini validate et
      const validationResult = getUsersQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const queryParams: GetUsersQueryInput = validationResult.data;

      // Servis katmanını çağır
      const result = await UsersService.getUsers(queryParams);

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
      console.error('Error in getUsers controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Get User by ID Endpoint Handler
   * 
   * GET /api/users/:id
   * Kullanıcı detayını istatistiklerle birlikte getirir.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametrelerini validate et
      const validationResult = userIdParamsSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id: userId } = validationResult.data;

      // Servis katmanını çağır
      const result = await UsersService.getUserById(userId);

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
      console.error('Error in getUserById controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER UPDATE ====================

  /**
   * Update User Endpoint Handler
   * 
   * PUT /api/users/:id
   * Kullanıcı bilgilerini günceller.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: UpdateUserRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametrelerini validate et
      const paramsValidation = userIdParamsSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: paramsValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      // Request body'yi validate et
      const bodyValidation = updateUserSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id: userId } = paramsValidation.data;
      const updateData: UpdateUserInput = bodyValidation.data;

      // Auth middleware'den gelen user bilgisi
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: USERS_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await UsersService.updateUser(userId, updateData, currentUserId);

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
      console.error('Error in updateUser controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Update User Role Endpoint Handler
   * 
   * PUT /api/users/:id/role
   * Kullanıcının rolünü günceller.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: UpdateUserRoleRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametrelerini validate et
      const paramsValidation = userIdParamsSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: paramsValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      // Request body'yi validate et
      const bodyValidation = updateUserRoleSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id: userId } = paramsValidation.data;
      const roleData: UpdateUserRoleInput = bodyValidation.data;

      // Auth middleware'den gelen user bilgisi
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: USERS_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await UsersService.updateUserRole(userId, roleData, currentUserId);

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
      console.error('Error in updateUserRole controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  /**
   * Update User Status Endpoint Handler
   * 
   * PUT /api/users/:id/status
   * Kullanıcının aktiflik durumunu günceller.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id}, body: UpdateUserStatusRequest)
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametrelerini validate et
      const paramsValidation = userIdParamsSchema.safeParse(req.params);
      
      if (!paramsValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: paramsValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      // Request body'yi validate et
      const bodyValidation = updateUserStatusSchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: bodyValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id: userId } = paramsValidation.data;
      const statusData: UpdateUserStatusInput = bodyValidation.data;

      // Auth middleware'den gelen user bilgisi
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: USERS_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await UsersService.updateUserStatus(userId, statusData, currentUserId);

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
      console.error('Error in updateUserStatus controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== USER DELETE ====================

  /**
   * Delete User Endpoint Handler
   * 
   * DELETE /api/users/:id
   * Kullanıcıyı soft delete yapar (is_active = false).
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object (params: {id})
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // URL parametrelerini validate et
      const validationResult = userIdParamsSchema.safeParse(req.params);
      
      if (!validationResult.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: USERS_VALIDATION_MESSAGES.INVALID_DATA_FORMAT,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const { id: userId } = validationResult.data;

      // Auth middleware'den gelen user bilgisi
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: USERS_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      // Servis katmanını çağır
      const result = await UsersService.deleteUser(userId, currentUserId);

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
      console.error('Error in deleteUser controller:', error);
      next(error); // Global error handler'a ilet
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get Users Statistics Endpoint Handler
   * 
   * GET /api/users/statistics
   * Kullanıcı istatistiklerini getirir.
   * Admin yetkisi gerektirir.
   * 
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction for error handling
   * @returns {Promise<void>} HTTP response
   */
  static async getUsersStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Servis katmanını çağır
      const result = await UsersService.getUsersStatistics();

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
      console.error('Error in getUsersStatistics controller:', error);
      next(error); // Global error handler'a ilet
    }
  }
} 