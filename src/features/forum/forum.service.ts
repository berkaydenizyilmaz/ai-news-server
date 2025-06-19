/**
 * Forum Feature Service
 * 
 * Forum modülü için iş mantığını yönetir.
 * Model katmanını kullanarak forum işlemlerini gerçekleştirir.
 */

import { ForumCategoryModel, ForumTopicModel, ForumPostModel } from './forum.model';
import { 
  FORUM_ERROR_MESSAGES, 
  FORUM_SUCCESS_MESSAGES,
  FORUM_PERMISSIONS 
} from './forum.constants';
import { 
  CreateForumCategoryRequest,
  CreateForumTopicRequest,
  UpdateForumTopicRequest,
  CreateForumPostRequest,
  ForumServiceResponse,
  ForumQueryRequest
} from './forum.types';
import { UserRole } from '@/core/types/database.types';

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Check if user has permission
 */
function hasPermission(userRole: UserRole, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Forum Categories Service
 */
export class ForumCategoryService {
  /**
   * Get all forum categories
   */
  static async getCategories(): Promise<ForumServiceResponse> {
    try {
      const categories = await ForumCategoryModel.getCategories();
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: 'Kategoriler alınamadı'
      };
    }
  }

  /**
   * Get category by ID or slug
   */
  static async getCategoryById(id: string): Promise<ForumServiceResponse> {
    try {
      const category = await ForumCategoryModel.getCategoryById(id);
      
      if (!category) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.CATEGORY_NOT_FOUND
        };
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      return {
        success: false,
        error: 'Kategori alınamadı'
      };
    }
  }

  /**
   * Create new forum category
   */
  static async createCategory(
    categoryData: CreateForumCategoryRequest,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Check permissions
      if (!hasPermission(userRole, FORUM_PERMISSIONS.CAN_CREATE_CATEGORY)) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      const category = await ForumCategoryModel.createCategory(categoryData);

      return {
        success: true,
        data: category,
        message: FORUM_SUCCESS_MESSAGES.CATEGORY_CREATED
      };
    } catch (error) {
      return {
        success: false,
        error: 'Kategori oluşturulamadı'
      };
    }
  }

  /**
   * Update forum category
   */
  static async updateCategory(
    id: string,
    updates: Partial<CreateForumCategoryRequest>,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Check permissions
      if (!hasPermission(userRole, FORUM_PERMISSIONS.CAN_CREATE_CATEGORY)) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      const category = await ForumCategoryModel.updateCategory(id, updates);

      return {
        success: true,
        data: category,
        message: 'Kategori güncellendi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Kategori güncellenemedi'
      };
    }
  }

  /**
   * Delete forum category
   */
  static async deleteCategory(id: string, userRole: UserRole): Promise<ForumServiceResponse> {
    try {
      // Check permissions
      if (!hasPermission(userRole, FORUM_PERMISSIONS.CAN_CREATE_CATEGORY)) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      await ForumCategoryModel.deleteCategory(id);

      return {
        success: true,
        message: 'Kategori silindi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Kategori silinemedi'
      };
    }
  }
}

/**
 * Forum Topics Service
 */
export class ForumTopicService {
  /**
   * Get topics with filters
   */
  static async getTopics(query: ForumQueryRequest): Promise<ForumServiceResponse> {
    try {
      const result = await ForumTopicModel.getTopics(query);
      
      return {
        success: true,
        data: {
          topics: result.topics,
          total: result.total,
          page: query.page || 1,
          limit: query.limit || 20,
          total_pages: Math.ceil(result.total / (query.limit || 20))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Konular alınamadı'
      };
    }
  }

  /**
   * Get topic by ID or slug
   */
  static async getTopicById(id: string): Promise<ForumServiceResponse> {
    try {
      const topic = await ForumTopicModel.getTopicById(id);
      
      if (!topic) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.TOPIC_NOT_FOUND
        };
      }

      // Increment view count
      await ForumTopicModel.incrementViewCount(id);

      return {
        success: true,
        data: topic
      };
    } catch (error) {
      return {
        success: false,
        error: 'Konu alınamadı'
      };
    }
  }

  /**
   * Create new forum topic
   */
  static async createTopic(
    topicData: CreateForumTopicRequest,
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Check permissions
      if (!hasPermission(userRole, FORUM_PERMISSIONS.CAN_CREATE_TOPIC)) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      // Generate slug
      const slug = generateSlug(topicData.title);

      const topic = await ForumTopicModel.createTopic({
        ...topicData,
        user_id: userId,
        slug: slug
      });

      return {
        success: true,
        data: topic,
        message: FORUM_SUCCESS_MESSAGES.TOPIC_CREATED
      };
    } catch (error) {
      return {
        success: false,
        error: 'Konu oluşturulamadı'
      };
    }
  }

  /**
   * Update forum topic
   */
  static async updateTopic(
    id: string,
    updates: UpdateForumTopicRequest,
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Get topic to check ownership
      const topicResult = await this.getTopicById(id);
      if (!topicResult.success || !topicResult.data) {
        return topicResult;
      }

      const topic = topicResult.data;

      // Check permissions (owner or moderator/admin)
      const canEdit = topic.user_id === userId || hasPermission(userRole, FORUM_PERMISSIONS.CAN_MODERATE);
      if (!canEdit) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      // Update slug if title changed
      const updateData = { ...updates };
      if (updates.title) {
        updateData.slug = generateSlug(updates.title);
      }

      const updatedTopic = await ForumTopicModel.updateTopic(id, updateData);

      return {
        success: true,
        data: updatedTopic,
        message: 'Konu güncellendi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Konu güncellenemedi'
      };
    }
  }

  /**
   * Delete forum topic
   */
  static async deleteTopic(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Get topic to check ownership
      const topicResult = await this.getTopicById(id);
      if (!topicResult.success || !topicResult.data) {
        return topicResult;
      }

      const topic = topicResult.data;

      // Check permissions (owner or moderator/admin)
      const canDelete = topic.user_id === userId || hasPermission(userRole, FORUM_PERMISSIONS.CAN_MODERATE);
      if (!canDelete) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      await ForumTopicModel.deleteTopic(id);

      return {
        success: true,
        message: 'Konu silindi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Konu silinemedi'
      };
    }
  }
}

/**
 * Forum Posts Service
 */
export class ForumPostService {
  /**
   * Get posts by topic ID
   */
  static async getPostsByTopicId(topicId: string, page = 1, limit = 20): Promise<ForumServiceResponse> {
    try {
      const result = await ForumPostModel.getPostsByTopicId(topicId, page, limit);
      
      return {
        success: true,
        data: {
          posts: result.posts,
          total: result.total,
          page,
          limit,
          total_pages: Math.ceil(result.total / limit)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gönderiler alınamadı'
      };
    }
  }

  /**
   * Create new forum post
   */
  static async createPost(
    postData: CreateForumPostRequest,
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Check permissions
      if (!hasPermission(userRole, FORUM_PERMISSIONS.CAN_CREATE_POST)) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      // Check if topic exists and is not locked
      const topic = await ForumTopicModel.getTopicById(postData.topic_id);
      if (!topic) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.TOPIC_NOT_FOUND
        };
      }

      if (topic.status === 'locked') {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.TOPIC_LOCKED
        };
      }

      const post = await ForumPostModel.createPost({
        ...postData,
        user_id: userId
      });

      return {
        success: true,
        data: post,
        message: FORUM_SUCCESS_MESSAGES.POST_CREATED
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gönderi oluşturulamadı'
      };
    }
  }

  /**
   * Update forum post
   */
  static async updatePost(
    id: string,
    updates: { content: string },
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Get post to check ownership
      const post = await ForumPostModel.getPostById(id);
      if (!post) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.POST_NOT_FOUND
        };
      }

      // Check permissions (owner or moderator/admin)
      const canEdit = post.user_id === userId || hasPermission(userRole, FORUM_PERMISSIONS.CAN_MODERATE);
      if (!canEdit) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      const updatedPost = await ForumPostModel.updatePost(id, updates);

      return {
        success: true,
        data: updatedPost,
        message: 'Gönderi güncellendi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gönderi güncellenemedi'
      };
    }
  }

  /**
   * Delete forum post
   */
  static async deletePost(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<ForumServiceResponse> {
    try {
      // Get post to check ownership
      const post = await ForumPostModel.getPostById(id);
      if (!post) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.POST_NOT_FOUND
        };
      }

      // Check permissions (owner or moderator/admin)
      const canDelete = post.user_id === userId || hasPermission(userRole, FORUM_PERMISSIONS.CAN_MODERATE);
      if (!canDelete) {
        return {
          success: false,
          error: FORUM_ERROR_MESSAGES.UNAUTHORIZED
        };
      }

      await ForumPostModel.deletePost(id);

      return {
        success: true,
        message: 'Gönderi silindi'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Gönderi silinemedi'
      };
    }
  }
} 