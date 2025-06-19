/**
 * Forum Feature Controller
 * 
 * Forum modülü için HTTP isteklerini yönetir.
 * Request/Response işlemleri ve validasyon.
 */

import { Response } from 'express';
import { Request } from '@/core/types';
import { ForumCategoryService, ForumTopicService, ForumPostService } from './forum.service';
import { 
  createForumCategorySchema,
  createForumTopicSchema,
  createForumPostSchema
} from './forum.validation';
import { HTTP_STATUS } from '@/core/constants';
import { UserRole } from '@/core/types/database.types';

/**
 * Forum Categories Controller
 */
export class ForumCategoryController {
  /**
   * Get all forum categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const result = await ForumCategoryService.getCategories();

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ForumCategoryService.getCategoryById(id);

      if (!result.success) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Create new forum category
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const validation = createForumCategorySchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Geçersiz veri',
          details: validation.error.errors
        });
        return;
      }

      const userRole = (req.user?.role || 'visitor') as UserRole;
      const result = await ForumCategoryService.createCategory(validation.data, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
}

/**
 * Forum Topics Controller
 */
export class ForumTopicController {
  /**
   * Get topics with filters
   */
  static async getTopics(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        category_id: req.query.category_id as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort_by: req.query.sort_by as string,
        sort_order: req.query.sort_order as 'asc' | 'desc',
        search: req.query.search as string,
        status: req.query.status as string,
        is_pinned: req.query.is_pinned === 'true'
      };

      const result = await ForumTopicService.getTopics(query);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Get topic by ID
   */
  static async getTopicById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ForumTopicService.getTopicById(id);

      if (!result.success) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Create new forum topic
   */
  static async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const validation = createForumTopicSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Geçersiz veri',
          details: validation.error.errors
        });
        return;
      }

      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumTopicService.createTopic(validation.data, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Update forum topic
   */
  static async updateTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumTopicService.updateTopic(id, req.body, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Delete forum topic
   */
  static async deleteTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumTopicService.deleteTopic(id, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
}

/**
 * Forum Posts Controller
 */
export class ForumPostController {
  /**
   * Get posts by topic ID
   */
  static async getPostsByTopicId(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ForumPostService.getPostsByTopicId(topicId, page, limit);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Create new forum post
   */
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const validation = createForumPostSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Geçersiz veri',
          details: validation.error.errors
        });
        return;
      }

      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumPostService.createPost(validation.data, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Update forum post
   */
  static async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumPostService.updatePost(id, req.body, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }

  /**
   * Delete forum post
   */
  static async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = (req.user?.role || 'visitor') as UserRole;

      if (!userId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Giriş yapmanız gerekiyor'
        });
        return;
      }

      const result = await ForumPostService.deletePost(id, userId, userRole);

      if (!result.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Sunucu hatası'
      });
    }
  }
} 