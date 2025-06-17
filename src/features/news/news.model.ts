/**
 * News Feature Data Access Layer
 * 
 * News modülü için veritabanı işlemlerini yönetir.
 * Supabase client kullanarak CRUD operasyonları gerçekleştirir.
 */

import { supabaseAdmin } from '@/database';
import { NEWS_VALIDATION_RULES } from './news.constants';
import { 
  ProcessedNews, 
  NewsCategory, 
  NewsSource, 
  OriginalNews,
  NewsWithRelations,
  CategoryWithStats,
  OriginalNewsProcessingStatus
} from '@/core/types/database.types';
import { 
  CreateNewsInput, 
  UpdateNewsInput, 
  NewsQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput
} from './news.validation';

/**
 * News Model Class
 * 
 * Static metodlarla news veritabanı işlemlerini yönetir.
 * Supabase admin client kullanarak güvenli veritabanı erişimi sağlar.
 */
export class NewsModel {
  
  // ==================== PROCESSED NEWS OPERATIONS ====================
  
  /**
   * Create Processed News
   * 
   * Yeni işlenmiş haber oluşturur.
   * 
   * @param newsData - Haber verisi
   * @returns {Promise<ProcessedNews | null>}
   */
  static async createProcessedNews(newsData: CreateNewsInput): Promise<ProcessedNews | null> {
    try {
      // Slug oluştur
      const slug = this.generateSlug(newsData.title);
      
      const { data, error } = await supabaseAdmin
        .from('processed_news')
        .insert({
          ...newsData,
          slug,
          view_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating processed news:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createProcessedNews:', error);
      return null;
    }
  }

  /**
   * Get Processed News with Pagination and Filters
   * 
   * Sayfalama ve filtreleme ile işlenmiş haberleri getirir.
   * 
   * @param queryParams - Sorgu parametreleri
   * @returns {Promise<{news: NewsWithRelations[], total: number} | null>}
   */
  static async getProcessedNews(
    queryParams: NewsQueryInput
  ): Promise<{news: NewsWithRelations[], total: number} | null> {
    try {
      let query = supabaseAdmin
        .from('processed_news')
        .select(`
          *,
          category:news_categories(id, name, slug),
          original_news:original_news(id, title, original_url, rss_source_id),
          sources:news_sources(id, source_name, source_url, is_primary),
          differences:news_differences(id, title, description)
        `, { count: 'exact' });

      // Filters
      if (queryParams.search) {
        query = query.or(`title.ilike.%${queryParams.search}%,content.ilike.%${queryParams.search}%`);
      }

      if (queryParams.category_id) {
        query = query.eq('category_id', queryParams.category_id);
      }

      if (queryParams.date_from) {
        query = query.gte('created_at', queryParams.date_from);
      }

      if (queryParams.date_to) {
        query = query.lte('created_at', queryParams.date_to);
      }

      // Sorting
      query = query.order(queryParams.sort_by, { ascending: queryParams.sort_order === 'asc' });

      // Pagination
      const offset = (queryParams.page - 1) * queryParams.limit;
      query = query.range(offset, offset + queryParams.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching processed news:', error);
        return null;
      }

      return {
        news: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getProcessedNews:', error);
      return null;
    }
  }

  /**
   * Get Processed News by ID
   * 
   * ID'ye göre işlenmiş haberi getirir.
   * 
   * @param id - Haber ID'si
   * @returns {Promise<NewsWithRelations | null>}
   */
  static async getProcessedNewsById(id: string): Promise<NewsWithRelations | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('processed_news')
        .select(`
          *,
          category:news_categories(id, name, slug, description),
          original_news:original_news(id, title, content, original_url, author, published_date, rss_source_id),
          sources:news_sources(id, source_name, source_url, is_primary),
          differences:news_differences(id, title, description)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching processed news by id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProcessedNewsById:', error);
      return null;
    }
  }

  /**
   * Update Processed News
   * 
   * İşlenmiş haberi günceller.
   * 
   * @param id - Haber ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<ProcessedNews | null>}
   */
  static async updateProcessedNews(
    id: string, 
    updateData: UpdateNewsInput
  ): Promise<ProcessedNews | null> {
    try {
      // Eğer başlık değişiyorsa slug'ı da güncelle
      const updatePayload: any = { ...updateData };
      if (updateData.title) {
        updatePayload.slug = this.generateSlug(updateData.title);
      }

      const { data, error } = await supabaseAdmin
        .from('processed_news')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating processed news:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProcessedNews:', error);
      return null;
    }
  }

  /**
   * Delete Processed News
   * 
   * İşlenmiş haberi siler.
   * 
   * @param id - Haber ID'si
   * @returns {Promise<boolean>}
   */
  static async deleteProcessedNews(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('processed_news')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting processed news:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProcessedNews:', error);
      return false;
    }
  }

  /**
   * Increment View Count
   * 
   * Haber görüntülenme sayısını artırır.
   * 
   * @param id - Haber ID'si
   * @returns {Promise<boolean>}
   */
  static async incrementViewCount(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .rpc('increment_news_view_count', { news_id: id });

      if (error) {
        console.error('Error incrementing view count:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in incrementViewCount:', error);
      return false;
    }
  }

  // ==================== NEWS CATEGORIES OPERATIONS ====================

  /**
   * Create News Category
   * 
   * Yeni haber kategorisi oluşturur.
   * 
   * @param categoryData - Kategori verisi
   * @returns {Promise<NewsCategory | null>}
   */
  static async createNewsCategory(categoryData: CreateCategoryInput): Promise<NewsCategory | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('news_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating news category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createNewsCategory:', error);
      return null;
    }
  }

  /**
   * Get News Categories
   * 
   * Haber kategorilerini getirir.
   * 
   * @param queryParams - Sorgu parametreleri
   * @returns {Promise<{categories: CategoryWithStats[], total: number} | null>}
   */
  static async getNewsCategories(
    queryParams: CategoryQueryInput
  ): Promise<{categories: CategoryWithStats[], total: number} | null> {
    try {
      let query = supabaseAdmin
        .from('news_categories')
        .select(`
          *,
          news_count:processed_news(count)
        `, { count: 'exact' });

      // Filters
      if (queryParams.search) {
        query = query.ilike('name', `%${queryParams.search}%`);
      }

      if (queryParams.is_active !== undefined) {
        query = query.eq('is_active', queryParams.is_active);
      }

      // Sorting
      query = query.order(queryParams.sort_by, { ascending: queryParams.sort_order === 'asc' });

      // Pagination
      const offset = (queryParams.page - 1) * queryParams.limit;
      query = query.range(offset, offset + queryParams.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching news categories:', error);
        return null;
      }

      return {
        categories: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getNewsCategories:', error);
      return null;
    }
  }

  /**
   * Get News Category by ID
   * 
   * ID'ye göre haber kategorisini getirir.
   * 
   * @param id - Kategori ID'si
   * @returns {Promise<NewsCategory | null>}
   */
  static async getNewsCategoryById(id: string): Promise<NewsCategory | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('news_categories')
        .select()
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching news category by id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getNewsCategoryById:', error);
      return null;
    }
  }

  /**
   * Update News Category
   * 
   * Haber kategorisini günceller.
   * 
   * @param id - Kategori ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<NewsCategory | null>}
   */
  static async updateNewsCategory(
    id: string, 
    updateData: UpdateCategoryInput
  ): Promise<NewsCategory | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('news_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating news category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateNewsCategory:', error);
      return null;
    }
  }

  /**
   * Delete News Category
   * 
   * Haber kategorisini siler.
   * 
   * @param id - Kategori ID'si
   * @returns {Promise<boolean>}
   */
  static async deleteNewsCategory(id: string): Promise<boolean> {
    try {
      // Önce bu kategoriye ait haber var mı kontrol et
      const { count } = await supabaseAdmin
        .from('processed_news')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

      if (count && count > 0) {
        return false; // Kategori kullanımda, silinemez
      }

      const { error } = await supabaseAdmin
        .from('news_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting news category:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteNewsCategory:', error);
      return false;
    }
  }

  // ==================== NEWS SOURCES OPERATIONS ====================

  /**
   * Create News Sources
   * 
   * Haber kaynakları oluşturur (toplu).
   * 
   * @param sources - Kaynak verisi array'i
   * @returns {Promise<NewsSource[] | null>}
   */
  static async createNewsSources(sources: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>[]): Promise<NewsSource[] | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('news_sources')
        .insert(sources)
        .select();

      if (error) {
        console.error('Error creating news sources:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createNewsSources:', error);
      return null;
    }
  }

  /**
   * Get Original News by ID
   * 
   * ID'ye göre orijinal haberi getirir.
   * 
   * @param id - Orijinal haber ID'si
   * @returns {Promise<OriginalNews | null>}
   */
  static async getOriginalNewsById(id: string): Promise<OriginalNews | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('original_news')
        .select()
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching original news by id:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOriginalNewsById:', error);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generate Slug from Title
   * 
   * Başlıktan URL-friendly slug oluşturur.
   * 
   * @param title - Haber başlığı
   * @returns {string}
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check Category Slug Exists
   * 
   * Kategori slug'ının var olup olmadığını kontrol eder.
   * 
   * @param slug - Kontrol edilecek slug
   * @param excludeId - Hariç tutulacak kategori ID'si (güncelleme için)
   * @returns {Promise<boolean>}
   */
  static async checkCategorySlugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabaseAdmin
        .from('news_categories')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { count } = await query;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking category slug exists:', error);
      return false;
    }
  }

  /**
   * Get Pending News for Processing
   * 
   * AI işleme için bekleyen haberleri getirir.
   * 
   * @param limit - Maksimum haber sayısı
   * @returns {Promise<OriginalNews[]>}
   */
  static async getPendingNewsForProcessing(limit: number = 10): Promise<OriginalNews[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('original_news')
        .select('*')
        .eq('processing_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching pending news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingNewsForProcessing:', error);
      return [];
    }
  }

  /**
   * Update News Processing Status
   * 
   * Haberin işleme durumunu günceller.
   * 
   * @param id - Haber ID'si
   * @param status - Yeni durum
   * @param errorMessage - Hata mesajı (opsiyonel)
   * @returns {Promise<boolean>}
   */
  static async updateNewsProcessingStatus(
    id: string, 
    status: OriginalNewsProcessingStatus,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        processing_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'failed' && errorMessage) {
        updateData.last_error_message = errorMessage;
        updateData.retry_count = supabaseAdmin.rpc('increment', { x: 1 });
        
        // Next retry time hesapla (exponential backoff)
        const retryDelay = Math.min(
          NEWS_VALIDATION_RULES.RETRY_BASE_DELAY * Math.pow(2, updateData.retry_count), 
          NEWS_VALIDATION_RULES.RETRY_MAX_DELAY
        );
        updateData.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
      }

      if (status === 'processing') {
        // Processing başladığında retry bilgilerini temizle
        updateData.last_error_message = null;
        updateData.next_retry_at = null;
      }

      const { error } = await supabaseAdmin
        .from('original_news')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating news processing status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateNewsProcessingStatus:', error);
      return false;
    }
  }

  /**
   * Get Failed News for Retry
   * 
   * Retry edilecek başarısız haberleri getirir.
   * 
   * @param limit - Maksimum kayıt sayısı
   * @returns {Promise<OriginalNews[]>}
   */
  static async getFailedNewsForRetry(limit: number = 5): Promise<OriginalNews[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('original_news')
        .select('*')
        .eq('processing_status', 'failed')
        .lt('retry_count', NEWS_VALIDATION_RULES.MAX_RETRY_ATTEMPTS)
        .lte('next_retry_at', new Date().toISOString())
        .order('next_retry_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching failed news for retry:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFailedNewsForRetry:', error);
      return [];
    }
  }

  /**
   * Update Original News Processing Status
   * 
   * Orijinal haberin işleme durumunu günceller.
   * 
   * @param id - Original news ID'si
   * @param status - Yeni status
   * @param errorMessage - Hata mesajı (opsiyonel)
   * @returns {Promise<boolean>}
   */
  static async updateOriginalNewsStatus(
    id: string, 
    status: OriginalNewsProcessingStatus,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        processing_status: status,
        updated_at: new Date().toISOString(),
      };

      // Hata mesajı varsa ekle
      if (errorMessage) {
        updateData.last_error_message = errorMessage;
      }

      // Failed durumunda retry count'u artır
      if (status === 'failed') {
        const { data: originalNews } = await supabaseAdmin
          .from('original_news')
          .select('retry_count, max_retries')
          .eq('id', id)
          .single();

        if (originalNews) {
          const newRetryCount = (originalNews.retry_count || 0) + 1;
          updateData.retry_count = newRetryCount;
          
          // Max retry'a ulaştıysa skipped yap
          if (newRetryCount >= originalNews.max_retries) {
            updateData.processing_status = 'skipped';
          } else {
            // Next retry time set et (exponential backoff)
            const delayMinutes = Math.min(60 * Math.pow(2, newRetryCount - 1), 1440); // Max 24 saat
            updateData.next_retry_at = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
          }
        }
      }

      const { error } = await supabaseAdmin
        .from('original_news')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating original news status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateOriginalNewsStatus:', error);
      return false;
    }
  }
} 