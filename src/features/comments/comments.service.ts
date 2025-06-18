/**
 * Comments Feature Business Logic Layer
 * 
 * Comments işlemlerinin tüm iş mantığını içerir.
 * Yorum yönetimi, yetkilendirme ve hiyerarşik yorum yapısı işlemleri.
 * 
 */

import { CommentsModel } from './comments.model';
import { 
  CreateCommentInput, 
  UpdateCommentInput, 
  CommentQueryInput,
  CommentIdInput,
  BulkModerationInput
} from './comments.validation';
import { 
  CommentServiceResponse,
  CommentStatistics,
  BulkModerationResult,
} from './comments.types';
import { 
  COMMENT_ERROR_MESSAGES,
  COMMENT_SUCCESS_MESSAGES,
  COMMENT_PERMISSIONS,
  COMMENT_QUERY_CONSTRAINTS 
} from './comments.constants';
import { Comment, CommentWithUser } from '@/core/types/database.types';

/**
 * Comments Service Class
 * 
 * Static metodlarla Comments iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class CommentsService {
  
  // ==================== COMMENT CRUD OPERATIONS ====================
  
  /**
   * Create Comment Business Logic
   * 
   * Yeni yorum oluşturma için tüm iş mantığını yönetir:
   * - Kullanıcı yetki kontrolü
   * - Haber varlık kontrolü
   * - Ana yorum kontrolü (reply ise)
   * - Derinlik kontrolü
   * - Veritabanına kaydetme
   * 
   * @param commentData - Validasyon geçmiş yorum verisi
   * @param userId - Yorum yapan kullanıcı ID'si
   * @param userRole - Kullanıcı rolü
   * @returns {Promise<CommentServiceResponse<Comment>>}
   */
  static async createComment(
    commentData: CreateCommentInput,
    userId: string,
    userRole: string
  ): Promise<CommentServiceResponse<Comment>> {
    try {
      // Yetki kontrolü
      if (!COMMENT_PERMISSIONS.CAN_CREATE.includes(userRole)) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        };
      }

      // Haber varlık kontrolü
      const newsExists = await CommentsModel.checkNewsExists(commentData.processed_news_id);
      if (!newsExists) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.NEWS_NOT_FOUND,
        };
      }

      // Ana yorum kontrolü (reply ise)
      if (commentData.parent_id) {
        const parentComment = await CommentsModel.getCommentById(commentData.parent_id);
        if (!parentComment) {
          return {
            success: false,
            error: COMMENT_ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND,
          };
        }

        if (parentComment.is_deleted) {
          return {
            success: false,
            error: COMMENT_ERROR_MESSAGES.CANNOT_REPLY_TO_DELETED,
          };
        }

        // Derinlik kontrolü
        const depth = await CommentsModel.getCommentDepth(commentData.parent_id);
        if (depth >= COMMENT_QUERY_CONSTRAINTS.MAX_REPLY_DEPTH) {
          return {
            success: false,
            error: COMMENT_ERROR_MESSAGES.MAX_REPLY_DEPTH_EXCEEDED,
          };
        }
      }

      // Yorumu oluştur
      const comment = await CommentsModel.createComment(commentData, userId);

      if (!comment) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_CREATE_FAILED,
        };
      }

      return {
        success: true,
        data: comment,
        message: COMMENT_SUCCESS_MESSAGES.COMMENT_CREATED,
      };
    } catch (error) {
      console.error('Error in createComment service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Comments for News with Pagination
   * 
   * Belirli bir haberin yorumlarını sayfalama ile getirme işlemi.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @param userRole - Kullanıcı rolü (silinmiş yorumları görmek için)
   * @returns {Promise<CommentServiceResponse<{comments: CommentWithUser[], total: number, page: number, limit: number}>>}
   */
  static async getCommentsForNews(
    queryParams: CommentQueryInput,
    userRole?: string
  ): Promise<CommentServiceResponse<{
    comments: CommentWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      // Silinmiş yorumları görebilir mi kontrolü
      if (queryParams.include_deleted && userRole && !COMMENT_PERMISSIONS.CAN_VIEW_DELETED.includes(userRole)) {
        queryParams.include_deleted = false;
      }

      const result = await CommentsModel.getCommentsForNews(queryParams);

      if (!result) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
        };
      }

      const totalPages = Math.ceil(result.total / queryParams.limit);

      return {
        success: true,
        data: {
          comments: result.comments,
          total: result.total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getCommentsForNews service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Comment by ID
   * 
   * ID'ye göre yorum getirme işlemi.
   * 
   * @param id - Yorum ID'si
   * @param userRole - Kullanıcı rolü (silinmiş yorumu görmek için)
   * @returns {Promise<CommentServiceResponse<CommentWithUser>>}
   */
  static async getCommentById(
    id: string,
    userRole?: string
  ): Promise<CommentServiceResponse<CommentWithUser>> {
    try {
      const comment = await CommentsModel.getCommentById(id);

      if (!comment) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
        };
      }

      // Silinmiş yorum kontrolü
      if (comment.is_deleted && userRole && !COMMENT_PERMISSIONS.CAN_VIEW_DELETED.includes(userRole)) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
        };
      }

      return {
        success: true,
        data: comment,
      };
    } catch (error) {
      console.error('Error in getCommentById service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Update Comment
   * 
   * Yorum güncelleme işlemi.
   * 
   * @param id - Yorum ID'si
   * @param updateData - Güncellenecek veriler
   * @param userId - İşlemi yapan kullanıcı ID'si
   * @param userRole - Kullanıcı rolü
   * @returns {Promise<CommentServiceResponse<Comment>>}
   */
  static async updateComment(
    id: string,
    updateData: UpdateCommentInput,
    userId: string,
    userRole: string
  ): Promise<CommentServiceResponse<Comment>> {
    try {
      // Yorumu getir
      const existingComment = await CommentsModel.getCommentById(id);
      if (!existingComment) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
        };
      }

      // Yetki kontrolü
      const canEdit = this.canEditComment(existingComment, userId, userRole);
      if (!canEdit.allowed) {
        return {
          success: false,
          error: canEdit.reason || COMMENT_ERROR_MESSAGES.CANNOT_EDIT,
        };
      }

      // Yorumu güncelle
      const updatedComment = await CommentsModel.updateComment(id, updateData);

      if (!updatedComment) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_UPDATE_FAILED,
        };
      }

      return {
        success: true,
        data: updatedComment,
        message: COMMENT_SUCCESS_MESSAGES.COMMENT_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateComment service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Delete Comment
   * 
   * Yorum silme işlemi (soft delete).
   * 
   * @param id - Yorum ID'si
   * @param userId - İşlemi yapan kullanıcı ID'si
   * @param userRole - Kullanıcı rolü
   * @returns {Promise<CommentServiceResponse<void>>}
   */
  static async deleteComment(
    id: string,
    userId: string,
    userRole: string
  ): Promise<CommentServiceResponse<void>> {
    try {
      // Yorumu getir
      const existingComment = await CommentsModel.getCommentById(id);
      if (!existingComment) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_NOT_FOUND,
        };
      }

      // Yetki kontrolü
      const canDelete = this.canDeleteComment(existingComment, userId, userRole);
      if (!canDelete.allowed) {
        return {
          success: false,
          error: canDelete.reason || COMMENT_ERROR_MESSAGES.CANNOT_DELETE,
        };
      }

      // Yorumu sil
      const deleted = await CommentsModel.deleteComment(id);

      if (!deleted) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.COMMENT_DELETE_FAILED,
        };
      }

      return {
        success: true,
        message: COMMENT_SUCCESS_MESSAGES.COMMENT_DELETED,
      };
    } catch (error) {
      console.error('Error in deleteComment service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== MODERATION OPERATIONS ====================

  /**
   * Bulk Moderation
   * 
   * Toplu moderasyon işlemi.
   * 
   * @param moderationData - Moderasyon verisi
   * @param userRole - Kullanıcı rolü
   * @returns {Promise<CommentServiceResponse<BulkModerationResult>>}
   */
  static async bulkModeration(
    moderationData: BulkModerationInput,
    userRole: string
  ): Promise<CommentServiceResponse<BulkModerationResult>> {
    try {
      // Yetki kontrolü
      if (!COMMENT_PERMISSIONS.CAN_MODERATE.includes(userRole)) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        };
      }

      const results: BulkModerationResult = {
        total_processed: 0,
        successful: 0,
        failed: 0,
        results: [],
      };

      for (const commentId of moderationData.comment_ids) {
        results.total_processed++;

        try {
          let success = false;
          
          if (moderationData.action === 'delete') {
            success = await CommentsModel.deleteComment(commentId);
          } else if (moderationData.action === 'restore') {
            success = await CommentsModel.restoreComment(commentId);
          }

          if (success) {
            results.successful++;
            results.results.push({
              comment_id: commentId,
              success: true,
            });
          } else {
            results.failed++;
            results.results.push({
              comment_id: commentId,
              success: false,
              error: 'Operation failed',
            });
          }
        } catch (error) {
          results.failed++;
          results.results.push({
            comment_id: commentId,
            success: false,
            error: 'Processing error',
          });
        }
      }

      return {
        success: true,
        data: results,
        message: COMMENT_SUCCESS_MESSAGES.BULK_OPERATION_COMPLETED,
      };
    } catch (error) {
      console.error('Error in bulkModeration service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Comment Statistics
   * 
   * Yorum istatistiklerini getirme işlemi.
   * 
   * @param userRole - Kullanıcı rolü
   * @returns {Promise<CommentServiceResponse<CommentStatistics>>}
   */
  static async getCommentStatistics(
    userRole: string
  ): Promise<CommentServiceResponse<CommentStatistics>> {
    try {
      // Yetki kontrolü
      if (!COMMENT_PERMISSIONS.CAN_VIEW_STATISTICS.includes(userRole)) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.UNAUTHORIZED,
        };
      }

      const statistics = await CommentsModel.getCommentStatistics();

      if (!statistics) {
        return {
          success: false,
          error: COMMENT_ERROR_MESSAGES.STATISTICS_FETCH_FAILED,
        };
      }

      return {
        success: true,
        data: statistics,
      };
    } catch (error) {
      console.error('Error in getCommentStatistics service:', error);
      return {
        success: false,
        error: COMMENT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if user can edit comment
   * 
   * @param comment - Yorum
   * @param userId - Kullanıcı ID'si
   * @param userRole - Kullanıcı rolü
   * @returns {object} Yetki durumu
   */
  private static canEditComment(
    comment: CommentWithUser,
    userId: string,
    userRole: string
  ): { allowed: boolean; reason?: string } {
    // Moderatör/admin her zaman düzenleyebilir
    if (COMMENT_PERMISSIONS.CAN_MODERATE.includes(userRole)) {
      return { allowed: true };
    }

    // Kendi yorumu değilse düzenleyemez
    if (comment.user_id !== userId) {
      return { allowed: false, reason: COMMENT_ERROR_MESSAGES.CANNOT_EDIT };
    }

    // Silinmiş yorum düzenlenemez
    if (comment.is_deleted) {
      return { allowed: false, reason: COMMENT_ERROR_MESSAGES.CANNOT_EDIT };
    }

    // 24 saat kontrolü
    const commentDate = new Date(comment.created_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);

    if (hoursPassed > COMMENT_PERMISSIONS.EDIT_TIME_LIMIT_HOURS) {
      return { allowed: false, reason: COMMENT_ERROR_MESSAGES.CANNOT_EDIT };
    }

    return { allowed: true };
  }

  /**
   * Check if user can delete comment
   * 
   * @param comment - Yorum
   * @param userId - Kullanıcı ID'si
   * @param userRole - Kullanıcı rolü
   * @returns {object} Yetki durumu
   */
  private static canDeleteComment(
    comment: CommentWithUser,
    userId: string,
    userRole: string
  ): { allowed: boolean; reason?: string } {
    // Moderatör/admin her zaman silebilir
    if (COMMENT_PERMISSIONS.CAN_MODERATE.includes(userRole)) {
      return { allowed: true };
    }

    // Kendi yorumu değilse silemez
    if (comment.user_id !== userId) {
      return { allowed: false, reason: COMMENT_ERROR_MESSAGES.CANNOT_DELETE };
    }

    // Zaten silinmişse silemez
    if (comment.is_deleted) {
      return { allowed: false, reason: COMMENT_ERROR_MESSAGES.CANNOT_DELETE };
    }

    return { allowed: true };
  }
} 