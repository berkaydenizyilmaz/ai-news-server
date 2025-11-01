/**
 * Forum Feature Model
 * 
 * Forum modülü için veritabanı işlemlerini yönetir.
 * Supabase ile forum kategorileri, konuları ve gönderileri için CRUD işlemleri.
 */

import { supabase, supabaseAdmin } from '@/database';
import { 
  ForumCategory, 
  ForumTopic, 
  ForumPost
} from '@/core/types/database.types';
import { 
  CreateForumCategoryRequest,
  CreateForumTopicRequest,
  CreateForumPostRequest,
  ForumQueryRequest,
  ForumCategoryWithStats,
  ForumTopicWithDetails,
  ForumPostWithUser
} from './forum.types';

/**
 * Forum Categories Model
 */
export class ForumCategoryModel {
  /**
   * Get all forum categories with statistics
   */
  static async getCategories(): Promise<ForumCategoryWithStats[]> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // For now, return categories without stats to fix the immediate issue
    // Stats can be added later with proper queries
    return (data || []).map(category => ({
      ...category,
      topic_count: 0,
      post_count: 0
    }));
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ForumCategory | null> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new forum category
   */
  static async createCategory(categoryData: CreateForumCategoryRequest): Promise<ForumCategory> {
    const { data, error } = await supabaseAdmin
      .from('forum_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update forum category
   */
  static async updateCategory(id: string, updates: Partial<ForumCategory>): Promise<ForumCategory> {
    const { data, error } = await supabaseAdmin
      .from('forum_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete forum category
   */
  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('forum_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

/**
 * Forum Topics Model
 */
export class ForumTopicModel {
  /**
   * Get topics with filters and pagination
   */
  static async getTopics(query: ForumQueryRequest): Promise<{ topics: ForumTopicWithDetails[], total: number }> {
    let supabaseQuery = supabase
      .from('forum_topics')
      .select(`
        *,
        category:forum_categories(*),
        user:users(id, username, avatar_url, role),
        posts:forum_posts(count)
      `, { count: 'exact' });

    // Apply filters
    if (query.category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', query.category_id);
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    } else {
      supabaseQuery = supabaseQuery.neq('status', 'deleted');
    }

    if (query.is_pinned !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_pinned', query.is_pinned);
    }

    if (query.search) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query.search}%,content.ilike.%${query.search}%`);
    }

    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order === 'asc' ? { ascending: true } : { ascending: false };
    
    if (sortBy === 'last_reply_at') {
      supabaseQuery = supabaseQuery.order('last_reply_at', { ascending: false, nullsFirst: false });
    } else {
      supabaseQuery = supabaseQuery.order(sortBy, sortOrder);
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error, count } = await supabaseQuery;

    if (error) throw error;
    return { topics: data || [], total: count || 0 };
  }

  /**
   * Get topic by ID with details
   */
  static async getTopicById(id: string): Promise<ForumTopicWithDetails | null> {
    const { data, error } = await supabase
      .from('forum_topics')
      .select(`
        *,
        category:forum_categories(*),
        user:users(id, username, avatar_url, role),
        posts:forum_posts(
          *,
          user:users(id, username, avatar_url, role)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get topic by slug
   */
  static async getTopicBySlug(slug: string): Promise<ForumTopicWithDetails | null> {
    const { data, error } = await supabase
      .from('forum_topics')
      .select(`
        *,
        category:forum_categories(*),
        user:users(id, username, avatar_url, role),
        posts:forum_posts(
          *,
          user:users(id, username, avatar_url, role)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new forum topic
   */
  static async createTopic(topicData: CreateForumTopicRequest & { user_id: string, slug: string }): Promise<ForumTopic> {
    const { data, error } = await supabaseAdmin
      .from('forum_topics')
      .insert(topicData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update forum topic
   */
  static async updateTopic(id: string, updates: Partial<ForumTopic>): Promise<ForumTopic> {
    const { data, error } = await supabaseAdmin
      .from('forum_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment topic view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    // Get current view count
    const { data: topic } = await supabaseAdmin
      .from('forum_topics')
      .select('view_count')
      .eq('id', id)
      .single();

    if (topic) {
      const { error } = await supabaseAdmin
        .from('forum_topics')
        .update({ view_count: (topic.view_count || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    }
  }

  /**
   * Update topic reply count and last reply time
   */
  static async updateTopicStats(topicId: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('update_forum_topic_stats', {
      topic_id: topicId
    });

    if (error) throw error;
  }

  /**
   * Delete forum topic (soft delete)
   */
  static async deleteTopic(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('forum_topics')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  }
}

/**
 * Forum Posts Model
 */
export class ForumPostModel {
  /**
   * Get posts by topic ID
   */
  static async getPostsByTopicId(topicId: string, page = 1, limit = 20): Promise<{ posts: ForumPostWithUser[], total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('forum_posts')
      .select(`
        *,
        user:users(id, username, avatar_url, role),
        quotes:forum_news_quotes(*)
      `, { count: 'exact' })
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return { posts: data || [], total: count || 0 };
  }

  /**
   * Get post by ID
   */
  static async getPostById(id: string): Promise<ForumPostWithUser | null> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        user:users(id, username, avatar_url, role),
        topic:forum_topics(*),
        quotes:forum_news_quotes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new forum post
   */
  static async createPost(postData: CreateForumPostRequest & { user_id: string }): Promise<ForumPost> {
    const { data, error } = await supabaseAdmin
      .from('forum_posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;

    // Update topic stats
    await ForumTopicModel.updateTopicStats(postData.topic_id);

    return data;
  }

  /**
   * Update forum post
   */
  static async updatePost(id: string, updates: Partial<ForumPost>): Promise<ForumPost> {
    const { data, error } = await supabaseAdmin
      .from('forum_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete forum post (soft delete)
   */
  static async deletePost(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('forum_posts')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
  }
} 