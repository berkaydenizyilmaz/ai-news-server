/**
 * RSS Feature Data Access Layer
 * 
 * Supabase veritabanı ile RSS işlemleri için CRUD operasyonları.
 * RSS kaynak yönetimi ve haber çekme işlemleri için veritabanı sorgularını içerir.
 * 
 */

import { supabaseAdmin } from '@/database';
import { RssSource, OriginalNews } from '@/core/types/database.types';
import { CreateRssSourceInput, UpdateRssSourceInput, RssSourceQueryInput } from './rss.validation';

/**
 * RSS Model Class
 * 
 * Static metodlarla RSS CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class RssModel {
  
  // ==================== RSS SOURCE CRUD OPERATIONS ====================
  
  /**
   * Create New RSS Source
   * 
   * Yeni RSS kaynağı oluşturur. Admin yetkisi gerektirir.
   * 
   * @param sourceData - RSS kaynak bilgileri
   * @param createdBy - Oluşturan kullanıcı ID'si
   * @returns {Promise<RssSource | null>} Oluşturulan RSS kaynağı veya null
   */
  static async createRssSource(
    sourceData: CreateRssSourceInput, 
    createdBy: string
  ): Promise<RssSource | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_sources')
        .insert({
          name: sourceData.name,
          url: sourceData.url,
          description: sourceData.description,
          created_by: createdBy,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating RSS source:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createRssSource:', error);
      return null;
    }
  }

  /**
   * Get RSS Sources with Pagination and Filters
   * 
   * RSS kaynaklarını sayfalama ve filtreleme ile getirir.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<{sources: RssSource[], total: number} | null>}
   */
  static async getRssSources(queryParams: RssSourceQueryInput): Promise<{
    sources: RssSource[];
    total: number;
  } | null> {
    try {
      let query = supabaseAdmin
        .from('rss_sources')
        .select('*', { count: 'exact' });

      // Filtreleme
      if (queryParams.is_active !== undefined) {
        query = query.eq('is_active', queryParams.is_active);
      }

      if (queryParams.search) {
        query = query.or(`name.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`);
      }

      // Sayfalama
      const offset = (queryParams.page - 1) * queryParams.limit;
      query = query
        .range(offset, offset + queryParams.limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching RSS sources:', error);
        return null;
      }

      return {
        sources: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getRssSources:', error);
      return null;
    }
  }

  /**
   * Get RSS Source by ID
   * 
   * ID'ye göre RSS kaynağını getirir.
   * 
   * @param id - RSS kaynak ID'si
   * @returns {Promise<RssSource | null>}
   */
  static async getRssSourceById(id: string): Promise<RssSource | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_sources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching RSS source by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getRssSourceById:', error);
      return null;
    }
  }

  /**
   * Update RSS Source
   * 
   * Mevcut RSS kaynağını günceller.
   * 
   * @param id - RSS kaynak ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<RssSource | null>}
   */
  static async updateRssSource(
    id: string, 
    updateData: UpdateRssSourceInput
  ): Promise<RssSource | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_sources')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating RSS source:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateRssSource:', error);
      return null;
    }
  }

  /**
   * Delete RSS Source
   * 
   * RSS kaynağını siler. Cascade delete ile ilişkili haberler de silinir.
   * 
   * @param id - RSS kaynak ID'si
   * @returns {Promise<boolean>}
   */
  static async deleteRssSource(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('rss_sources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting RSS source:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteRssSource:', error);
      return false;
    }
  }

  /**
   * Get Active RSS Sources
   * 
   * Aktif RSS kaynaklarını getirir. Haber çekme işlemi için kullanılır.
   * 
   * @returns {Promise<RssSource[]>}
   */
  static async getActiveRssSources(): Promise<RssSource[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_sources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active RSS sources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveRssSources:', error);
      return [];
    }
  }

  /**
   * Update Last Fetched Time
   * 
   * RSS kaynağının son çekme zamanını günceller.
   * 
   * @param id - RSS kaynak ID'si
   * @returns {Promise<boolean>}
   */
  static async updateLastFetched(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('rss_sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating last fetched time:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLastFetched:', error);
      return false;
    }
  }

  // ==================== ORIGINAL NEWS OPERATIONS ====================

  /**
   * Create Original News
   * 
   * RSS'den çekilen haberi original_news tablosuna kaydeder.
   * 
   * @param newsData - Haber verisi
   * @returns {Promise<OriginalNews | null>}
   */
  static async createOriginalNews(newsData: {
    title: string;
    content?: string;
    summary?: string;
    original_url: string;
    image_url?: string;
    author?: string;
    published_date?: string;
    rss_source_id: string;
    content_embedding?: number[];
    processed_time?: number;
  }): Promise<OriginalNews | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('original_news')
        .insert(newsData)
        .select()
        .single();

      if (error) {
        console.error('Error creating original news:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createOriginalNews:', error);
      return null;
    }
  }

  /**
   * Check News URL Exists
   * 
   * Aynı URL'den haber daha önce çekilmiş mi kontrol eder.
   * 
   * @param url - Haber URL'i
   * @returns {Promise<boolean>}
   */
  static async checkNewsUrlExists(url: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('original_news')
        .select('id')
        .eq('original_url', url)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned - URL doesn't exist
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in checkNewsUrlExists:', error);
      return false;
    }
  }

  /**
   * Find Similar News by Embedding
   * 
   * Vector embedding kullanarak benzer haberleri bulur.
   * 
   * @param embedding - Haber içeriğinin embedding'i
   * @param threshold - Benzerlik eşiği (default: 0.85)
   * @returns {Promise<{id: string, title: string, similarity: number}[]>}
   */
  static async findSimilarNews(
    embedding: number[], 
    threshold: number = 0.85
  ): Promise<{id: string, title: string, similarity: number}[]> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('find_similar_news', {
          query_embedding: embedding,
          similarity_threshold: threshold,
          max_results: 5
        });

      if (error) {
        console.error('Error finding similar news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in findSimilarNews:', error);
      return [];
    }
  }

  /**
   * Update News Embedding
   * 
   * Haberin vector embedding'ini günceller.
   * 
   * @param id - Haber ID'si
   * @param embedding - Vector embedding
   * @returns {Promise<boolean>}
   */
  static async updateNewsEmbedding(id: string, embedding: number[]): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('original_news')
        .update({
          content_embedding: embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating news embedding:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNewsEmbedding:', error);
      return false;
    }
  }
} 