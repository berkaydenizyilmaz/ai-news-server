/**
 * Comments Feature Data Access Layer
 * 
 * Supabase veritabanı ile comment işlemleri için CRUD operasyonları.
 * Yorum yönetimi ve hiyerarşik yorum yapısı için veritabanı sorgularını içerir.
 */

import { supabaseAdmin } from '@/database';
import { Comment, CommentWithUser } from '@/core/types/database.types';
import { CreateCommentInput, UpdateCommentInput, CommentQueryInput } from './comments.validation';

/**
 * Comments Model Class
 * 
 * Static metodlarla Comment CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class CommentsModel {
  
  // ==================== COMMENT CRUD OPERATIONS ====================
  
  /**
   * Create New Comment
   * 
   * Yeni yorum oluşturur.
   * 
   * @param commentData - Yorum verisi
   * @param userId - Yorum yapan kullanıcı ID'si
   * @returns {Promise<Comment | null>} Oluşturulan yorum veya null
   */
  static async createComment(
    commentData: CreateCommentInput,
    userId: string
  ): Promise<Comment | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('comments')
        .insert({
          content: commentData.content,
          processed_news_id: commentData.processed_news_id,
          parent_id: commentData.parent_id || null,
          user_id: userId,
          is_deleted: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createComment:', error);
      return null;
    }
  }

  /**
   * Get Comments for News with Pagination
   * 
   * Belirli bir haberin yorumlarını sayfalama ile getirir.
   * 
   * @param queryParams - Sorgu parametreleri
   * @returns {Promise<{comments: CommentWithUser[], total: number} | null>}
   */
  static async getCommentsForNews(queryParams: CommentQueryInput): Promise<{
    comments: CommentWithUser[];
    total: number;
  } | null> {
    try {
      // Base query - ana yorumları getir (parent_id null olanlar)
      let query = supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users(id, username, avatar_url, role)
        `, { count: 'exact' })
        .eq('processed_news_id', queryParams.processed_news_id)
        .is('parent_id', null); // Sadece ana yorumlar

      // Silinmiş yorumları dahil etme (admin değilse)
      if (!queryParams.include_deleted) {
        query = query.eq('is_deleted', false);
      }

      // Sıralama
      const ascending = queryParams.sort_order === 'asc';
      query = query.order(queryParams.sort_by, { ascending });

      // Sayfalama
      const offset = (queryParams.page - 1) * queryParams.limit;
      query = query.range(offset, offset + queryParams.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching comments:', error);
        return null;
      }

      // Her ana yorum için alt yorumları getir
      const commentsWithReplies: CommentWithUser[] = [];
      
      for (const comment of data || []) {
        const commentWithReplies = await this.getCommentWithReplies(
          comment.id, 
          queryParams.include_deleted
        );
        
        if (commentWithReplies) {
          commentsWithReplies.push(commentWithReplies);
        }
      }

      return {
        comments: commentsWithReplies,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getCommentsForNews:', error);
      return null;
    }
  }

  /**
   * Get Comment with Replies (Recursive)
   * 
   * Bir yorumu tüm alt yorumlarıyla birlikte getirir.
   * 
   * @param commentId - Ana yorum ID'si
   * @param includeDeleted - Silinmiş yorumları dahil et
   * @returns {Promise<CommentWithUser | null>}
   */
  static async getCommentWithReplies(
    commentId: string, 
    includeDeleted: boolean = false
  ): Promise<CommentWithUser | null> {
    try {
      // Ana yorumu getir
      const { data: comment, error } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users(id, username, avatar_url, role)
        `)
        .eq('id', commentId)
        .single();

      if (error || !comment) {
        console.error('Error fetching comment:', error);
        return null;
      }

      // Alt yorumları getir
      let repliesQuery = supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users(id, username, avatar_url, role)
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (!includeDeleted) {
        repliesQuery = repliesQuery.eq('is_deleted', false);
      }

      const { data: replies, error: repliesError } = await repliesQuery;

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        return comment; // Ana yorumu döndür, alt yorumlar olmasa da
      }

      // Recursive olarak alt yorumların da alt yorumlarını getir
      const repliesWithSubReplies: CommentWithUser[] = [];
      
      for (const reply of replies || []) {
        const replyWithSubReplies = await this.getCommentWithReplies(
          reply.id, 
          includeDeleted
        );
        
        if (replyWithSubReplies) {
          repliesWithSubReplies.push(replyWithSubReplies);
        }
      }

      return {
        ...comment,
        replies: repliesWithSubReplies,
      };
    } catch (error) {
      console.error('Error in getCommentWithReplies:', error);
      return null;
    }
  }

  /**
   * Get Comment by ID
   * 
   * ID'ye göre yorum getirir.
   * 
   * @param id - Yorum ID'si
   * @returns {Promise<CommentWithUser | null>}
   */
  static async getCommentById(id: string): Promise<CommentWithUser | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users(id, username, avatar_url, role)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching comment by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCommentById:', error);
      return null;
    }
  }

  /**
   * Update Comment
   * 
   * Yorumu günceller.
   * 
   * @param id - Yorum ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<Comment | null>}
   */
  static async updateComment(
    id: string,
    updateData: UpdateCommentInput
  ): Promise<Comment | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('comments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateComment:', error);
      return null;
    }
  }

  /**
   * Delete Comment (Soft Delete)
   * 
   * Yorumu soft delete yapar (is_deleted = true).
   * 
   * @param id - Yorum ID'si
   * @returns {Promise<boolean>}
   */
  static async deleteComment(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('comments')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return false;
    }
  }

  /**
   * Restore Comment
   * 
   * Silinmiş yorumu geri yükler.
   * 
   * @param id - Yorum ID'si
   * @returns {Promise<boolean>}
   */
  static async restoreComment(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('comments')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error restoring comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in restoreComment:', error);
      return false;
    }
  }

  // ==================== COMMENT STATISTICS ====================

  /**
   * Get Comment Statistics
   * 
   * Yorum istatistiklerini getirir.
   * 
   * @returns {Promise<any | null>}
   */
  static async getCommentStatistics(): Promise<any | null> {
    try {
      // Toplam yorum sayısı
      const { count: totalComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true });

      // Aktif yorum sayısı
      const { count: activeComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      // Silinmiş yorum sayısı
      const { count: deletedComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', true);

      // Ana yorum sayısı (parent_id null)
      const { count: topLevelComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .is('parent_id', null)
        .eq('is_deleted', false);

      // Alt yorum sayısı (parent_id not null)
      const { count: replyComments } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .not('parent_id', 'is', null)
        .eq('is_deleted', false);

      // Bugünkü yorumlar
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: commentsToday } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .eq('is_deleted', false);

      // Bu haftaki yorumlar
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: commentsThisWeek } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())
        .eq('is_deleted', false);

      // Bu ayki yorumlar
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { count: commentsThisMonth } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString())
        .eq('is_deleted', false);

      return {
        total_comments: totalComments || 0,
        active_comments: activeComments || 0,
        deleted_comments: deletedComments || 0,
        top_level_comments: topLevelComments || 0,
        reply_comments: replyComments || 0,
        comments_today: commentsToday || 0,
        comments_this_week: commentsThisWeek || 0,
        comments_this_month: commentsThisMonth || 0,
      };
    } catch (error) {
      console.error('Error in getCommentStatistics:', error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if News Exists
   * 
   * Haber var mı kontrol eder.
   * 
   * @param newsId - Haber ID'si
   * @returns {Promise<boolean>}
   */
  static async checkNewsExists(newsId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('processed_news')
        .select('id')
        .eq('id', newsId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Check Comment Depth
   * 
   * Yorum derinliğini kontrol eder.
   * 
   * @param parentId - Ana yorum ID'si
   * @returns {Promise<number>}
   */
  static async getCommentDepth(parentId: string): Promise<number> {
    try {
      let depth = 0;
      let currentParentId: string | null = parentId;

      while (currentParentId && depth < 10) { // Sonsuz döngü koruması
        const { data }: { data: any } = await supabaseAdmin
          .from('comments')
          .select('parent_id')
          .eq('id', currentParentId)
          .single();

        if (!data) break;
        
        currentParentId = data.parent_id;
        depth++;
      }

      return depth;
    } catch {
      return 0;
    }
  }
} 