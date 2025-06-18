/**
 * News Feature Business Logic Layer
 * 
 * News işlemlerinin tüm iş mantığını içerir.
 * Haber yönetimi, kategori yönetimi ve AI-powered haber üretimi.
 */

import { NewsModel } from './news.model';
import { NewsGenerationService } from './news-generation.service';
import { 
  CreateNewsInput, 
  UpdateNewsInput, 
  NewsQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
  BulkNewsOperationInput
} from './news.validation';
import { 
  NewsServiceResponse,
  NewsListResponse,
  CategoryListResponse,
  NewsDetailResponse,
  NewsGenerationResult,
  NewsGenerationRequest,
  NewsProcessingResult,
  BulkNewsOperationResult,
  NewsStatistics
} from './news.types';
import { 
  NEWS_ERROR_MESSAGES,
  NEWS_SUCCESS_MESSAGES,
  NEWS_QUERY_CONSTRAINTS 
} from './news.constants';
import { 
  ProcessedNews, 
  NewsCategory,
  NewsWithRelations,
  CategoryWithStats
} from '@/core/types/database.types';

/**
 * News Service Class
 * 
 * Static metodlarla news iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class NewsService {
  
  // ==================== PROCESSED NEWS MANAGEMENT ====================
  
  /**
   * Create Processed News Business Logic
   * 
   * Yeni işlenmiş haber oluşturma için tüm iş mantığını yönetir.
   * 
   * @param newsData - Validasyon geçmiş haber verisi
   * @returns {Promise<NewsServiceResponse<ProcessedNews>>}
   */
  static async createProcessedNews(
    newsData: CreateNewsInput
  ): Promise<NewsServiceResponse<ProcessedNews>> {
    try {
      // Kategori kontrolü
      if (newsData.category_id) {
        const category = await NewsModel.getNewsCategoryById(newsData.category_id);
        if (!category || !category.is_active) {
          return {
            success: false,
            error: NEWS_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
          };
        }
      }

      // Haber oluştur
      const processedNews = await NewsModel.createProcessedNews(newsData);

      if (!processedNews) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_CREATE_FAILED,
        };
      }

      return {
        success: true,
        data: processedNews,
        message: NEWS_SUCCESS_MESSAGES.NEWS_CREATED,
      };
    } catch (error) {
      console.error('Error in createProcessedNews service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Processed News with Pagination and Filters
   * 
   * Sayfalama ve filtreleme ile işlenmiş haberleri getirme işlemi.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<NewsServiceResponse<NewsListResponse>>}
   */
  static async getProcessedNews(
    queryParams: NewsQueryInput
  ): Promise<NewsServiceResponse<NewsListResponse>> {
    try {
      const result = await NewsModel.getProcessedNews(queryParams);

      if (!result) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
        };
      }

      const totalPages = Math.ceil(result.total / queryParams.limit);

      return {
        success: true,
        data: {
          news: result.news,
          total: result.total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getProcessedNews service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Processed News by ID with Details
   * 
   * ID'ye göre işlenmiş haberi detaylarıyla getirme işlemi.
   * 
   * @param id - Haber ID'si
   * @returns {Promise<NewsServiceResponse<NewsDetailResponse>>}
   */
  static async getProcessedNewsById(id: string): Promise<NewsServiceResponse<NewsDetailResponse>> {
    try {
      const newsWithRelations = await NewsModel.getProcessedNewsById(id);

      if (!newsWithRelations) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
        };
      }

      // Görüntülenme sayısını artır
      await NewsModel.incrementViewCount(id);

      // İlgili haberleri getir (aynı kategoriden)
      let relatedNews: ProcessedNews[] = [];
      if (newsWithRelations.category_id) {
        const relatedResult = await NewsModel.getProcessedNews({
          page: 1,
          limit: 5,
          category_id: newsWithRelations.category_id,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        if (relatedResult) {
          relatedNews = relatedResult.news
            .filter(news => news.id !== id) // Mevcut haberi hariç tut
            .slice(0, 4); // Maksimum 4 ilgili haber
        }
      }

      const newsDetail: NewsDetailResponse = {
        ...newsWithRelations,
        related_news: relatedNews,
      };

      return {
        success: true,
        data: newsDetail,
      };
    } catch (error) {
      console.error('Error in getProcessedNewsById service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Processed News by Slug with Details
   * 
   * Slug'a göre işlenmiş haberi detaylarıyla getirme işlemi.
   * 
   * @param slug - Haber slug'ı
   * @returns {Promise<NewsServiceResponse<NewsDetailResponse>>}
   */
  static async getProcessedNewsBySlug(slug: string): Promise<NewsServiceResponse<NewsDetailResponse>> {
    try {
      const newsWithRelations = await NewsModel.getProcessedNewsBySlug(slug);

      if (!newsWithRelations) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
        };
      }

      // Görüntülenme sayısını artır
      await NewsModel.incrementViewCount(newsWithRelations.id);

      // İlgili haberleri getir (aynı kategoriden)
      let relatedNews: ProcessedNews[] = [];
      if (newsWithRelations.category_id) {
        const relatedResult = await NewsModel.getProcessedNews({
          page: 1,
          limit: 5,
          category_id: newsWithRelations.category_id,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        if (relatedResult) {
          relatedNews = relatedResult.news
            .filter(news => news.id !== newsWithRelations.id) // Mevcut haberi hariç tut
            .slice(0, 4); // Maksimum 4 ilgili haber
        }
      }

      const newsDetail: NewsDetailResponse = {
        ...newsWithRelations,
        related_news: relatedNews,
      };

      return {
        success: true,
        data: newsDetail,
      };
    } catch (error) {
      console.error('Error in getProcessedNewsBySlug service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Update Processed News
   * 
   * İşlenmiş haberi güncelleme işlemi.
   * 
   * @param id - Haber ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<NewsServiceResponse<ProcessedNews>>}
   */
  static async updateProcessedNews(
    id: string, 
    updateData: UpdateNewsInput
  ): Promise<NewsServiceResponse<ProcessedNews>> {
    try {
      // Haber varlığını kontrol et
      const existingNews = await NewsModel.getProcessedNewsById(id);
      if (!existingNews) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
        };
      }

      // Kategori kontrolü
      if (updateData.category_id) {
        const category = await NewsModel.getNewsCategoryById(updateData.category_id);
        if (!category || !category.is_active) {
          return {
            success: false,
            error: NEWS_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
          };
        }
      }

      // Haberi güncelle
      const updatedNews = await NewsModel.updateProcessedNews(id, updateData);

      if (!updatedNews) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_UPDATE_FAILED,
        };
      }

      return {
        success: true,
        data: updatedNews,
        message: NEWS_SUCCESS_MESSAGES.NEWS_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateProcessedNews service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Delete Processed News
   * 
   * İşlenmiş haberi silme işlemi.
   * 
   * @param id - Haber ID'si
   * @returns {Promise<NewsServiceResponse<void>>}
   */
  static async deleteProcessedNews(id: string): Promise<NewsServiceResponse<void>> {
    try {
      // Haber varlığını kontrol et
      const existingNews = await NewsModel.getProcessedNewsById(id);
      if (!existingNews) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
        };
      }

      // Haberi sil
      const deleted = await NewsModel.deleteProcessedNews(id);

      if (!deleted) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.NEWS_DELETE_FAILED,
        };
      }

      return {
        success: true,
        message: NEWS_SUCCESS_MESSAGES.NEWS_DELETED,
      };
    } catch (error) {
      console.error('Error in deleteProcessedNews service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== NEWS CATEGORIES MANAGEMENT ====================

  /**
   * Create News Category
   * 
   * Yeni haber kategorisi oluşturur.
   * 
   * @param categoryData - Kategori verisi
   * @returns {Promise<NewsServiceResponse<NewsCategory>>}
   */
  static async createCategory(categoryData: CreateCategoryInput): Promise<NewsServiceResponse<NewsCategory>> {
    try {
      // Slug benzersizliğini kontrol et
      const slugExists = await NewsModel.checkCategorySlugExists(categoryData.slug);
      if (slugExists) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_SLUG_EXISTS,
        };
      }

      const category = await NewsModel.createNewsCategory(categoryData);
      if (!category) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_CREATE_FAILED,
        };
      }

      return {
        success: true,
        data: category,
        message: NEWS_SUCCESS_MESSAGES.CATEGORY_CREATED,
      };
    } catch (error) {
      console.error('Error in createCategory:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.CATEGORY_CREATE_FAILED,
      };
    }
  }

  /**
   * Get News Categories with Pagination
   * 
   * Haber kategorilerini sayfalama ile getirme işlemi.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<NewsServiceResponse<CategoryListResponse>>}
   */
  static async getNewsCategories(
    queryParams: CategoryQueryInput
  ): Promise<NewsServiceResponse<CategoryListResponse>> {
    try {
      const result = await NewsModel.getNewsCategories(queryParams);

      if (!result) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
        };
      }

      const totalPages = Math.ceil(result.total / queryParams.limit);

      return {
        success: true,
        data: {
          categories: result.categories,
          total: result.total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getNewsCategories service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Update News Category
   * 
   * Haber kategorisini güncelleme işlemi.
   * 
   * @param id - Kategori ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<NewsServiceResponse<NewsCategory>>}
   */
  static async updateNewsCategory(
    id: string, 
    updateData: UpdateCategoryInput
  ): Promise<NewsServiceResponse<NewsCategory>> {
    try {
      // Kategori varlığını kontrol et
      const existingCategory = await NewsModel.getNewsCategoryById(id);
      if (!existingCategory) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
        };
      }

      // Slug duplicate kontrolü (güncelleniyorsa)
      if (updateData.slug) {
        const slugExists = await NewsModel.checkCategorySlugExists(updateData.slug, id);
        if (slugExists) {
          return {
            success: false,
            error: NEWS_ERROR_MESSAGES.CATEGORY_SLUG_EXISTS,
          };
        }
      }

      // Kategoriyi güncelle
      const updatedCategory = await NewsModel.updateNewsCategory(id, updateData);

      if (!updatedCategory) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_UPDATE_FAILED,
        };
      }

      return {
        success: true,
        data: updatedCategory,
        message: NEWS_SUCCESS_MESSAGES.CATEGORY_UPDATED,
      };
    } catch (error) {
      console.error('Error in updateNewsCategory service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Delete News Category
   * 
   * Haber kategorisini silme işlemi.
   * 
   * @param id - Kategori ID'si
   * @returns {Promise<NewsServiceResponse<void>>}
   */
  static async deleteNewsCategory(id: string): Promise<NewsServiceResponse<void>> {
    try {
      // Kategori varlığını kontrol et
      const existingCategory = await NewsModel.getNewsCategoryById(id);
      if (!existingCategory) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
        };
      }

      // Kategoriyi sil (model katmanında kullanım kontrolü yapılıyor)
      const deleted = await NewsModel.deleteNewsCategory(id);

      if (!deleted) {
        return {
          success: false,
          error: NEWS_ERROR_MESSAGES.CATEGORY_IN_USE,
        };
      }

      return {
        success: true,
        message: NEWS_SUCCESS_MESSAGES.CATEGORY_DELETED,
      };
    } catch (error) {
      console.error('Error in deleteNewsCategory service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== AI NEWS GENERATION ====================

  /**
   * Generate News From RSS
   * 
   * RSS'den gelen orijinal haberden AI ile yeni haber üretme.
   * 
   * @param generationInput - Haber üretim parametreleri
   * @returns {Promise<NewsServiceResponse<NewsGenerationResult>>}
   */
  static async generateNewsFromRSS(
    generationInput: NewsGenerationRequest
  ): Promise<NewsServiceResponse<NewsGenerationResult>> {
    try {
      // AI ile haber üret
      const generationResult = await NewsGenerationService.generateNews(generationInput);

      if (generationResult.status === 'rejected') {
        return {
          success: false,
          error: generationResult.rejection_reason || NEWS_ERROR_MESSAGES.GENERATION_FAILED,
        };
      }

      return {
        success: true,
        data: generationResult,
        message: NEWS_SUCCESS_MESSAGES.GENERATION_COMPLETED,
      };
    } catch (error) {
      console.error('Error in generateNewsFromRSS service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.GENERATION_FAILED,
      };
    }
  }

  /**
   * Process Multiple RSS News
   * 
   * Birden fazla RSS haberini toplu olarak işleme.
   * 
   * @param originalNewsIds - İşlenecek orijinal haber ID'leri
   * @param availableCategories - Mevcut kategoriler
   * @returns {Promise<NewsServiceResponse<NewsProcessingResult[]>>}
   */
  static async processMultipleRSSNews(
    originalNewsIds: string[],
    availableCategories: NewsCategory[]
  ): Promise<NewsServiceResponse<NewsProcessingResult[]>> {
    try {
      const results: NewsProcessingResult[] = [];

      for (const newsId of originalNewsIds) {
        const originalNews = await NewsModel.getOriginalNewsById(newsId);
        
        if (!originalNews) {
          results.push({
            original_news: {} as any,
            validation: {
              is_valid: false,
              is_suitable: false,
              rejection_reasons: [NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND],
              quality_score: 0,
              content_analysis: {} as any,
            },
            error: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
          });
          continue;
        }

        // Direkt haber üret - AI artık validasyonu yapıyor
        const generationResult = await NewsGenerationService.generateNews({
          original_news_id: newsId,
          available_categories: availableCategories,
          research_depth: 'standard',
        });

        results.push({
          original_news: originalNews,
          validation: {
            is_valid: generationResult.status === 'success',
            is_suitable: generationResult.status === 'success',
            rejection_reasons: generationResult.status === 'rejected' ? [generationResult.rejection_reason || 'Unknown error'] : [],
            quality_score: generationResult.confidence_score || 0,
            content_analysis: {} as any,
          },
          generation: generationResult,
        });
      }

      return {
        success: true,
        data: results,
        message: `${results.length} haber işlendi`,
      };
    } catch (error) {
      console.error('Error in processMultipleRSSNews service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk News Operations
   * 
   * Toplu haber işlemleri (yayınlama, silme, kategori değiştirme).
   * 
   * @param operationInput - Toplu işlem parametreleri
   * @returns {Promise<NewsServiceResponse<BulkNewsOperationResult>>}
   */
  static async bulkNewsOperation(
    operationInput: BulkNewsOperationInput
  ): Promise<NewsServiceResponse<BulkNewsOperationResult>> {
    try {
      const result: BulkNewsOperationResult = {
        success_count: 0,
        failed_count: 0,
        total_count: operationInput.news_ids.length,
        failed_items: [],
      };

      for (const newsId of operationInput.news_ids) {
        try {
          let success = false;

          switch (operationInput.operation) {
            case 'delete':
              const deleteResult = await this.deleteProcessedNews(newsId);
              success = deleteResult.success;
              break;

            case 'update_category':
              if (operationInput.data?.category_id) {
                const updateResult = await this.updateProcessedNews(newsId, {
                  category_id: operationInput.data.category_id
                });
                success = updateResult.success;
              }
              break;
          }

          if (success) {
            result.success_count++;
          } else {
            result.failed_count++;
            result.failed_items.push({
              id: newsId,
              error: 'İşlem başarısız',
            });
          }
        } catch (error) {
          result.failed_count++;
          result.failed_items.push({
            id: newsId,
            error: 'Beklenmeyen hata',
          });
        }
      }

      return {
        success: true,
        data: result,
        message: `${result.success_count} başarılı, ${result.failed_count} başarısız`,
      };
    } catch (error) {
      console.error('Error in bulkNewsOperation service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get News Statistics
   * 
   * Haber istatistiklerini getirme işlemi.
   * 
   * @returns {Promise<NewsServiceResponse<NewsStatistics>>}
   */
  static async getNewsStatistics(): Promise<NewsServiceResponse<NewsStatistics>> {
    try {
      // Bu fonksiyon veritabanında stored procedure veya view kullanılarak optimize edilebilir
      const allNews = await NewsModel.getProcessedNews({
        page: 1,
        limit: 1,
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      const categories = await NewsModel.getNewsCategories({
        page: 1,
        limit: 1,
        sort_by: 'name',
        sort_order: 'asc',
      });

      // Mock statistics - gerçek implementasyonda SQL aggregate fonksiyonları kullanılmalı
      const stats: NewsStatistics = {
        total_news: allNews?.total || 0,
        published_news: 0, // SELECT COUNT(*) FROM original_news WHERE processing_status = 'completed'
        pending_news: 0,   // SELECT COUNT(*) FROM original_news WHERE processing_status = 'pending'
        processing_news: 0, // SELECT COUNT(*) FROM original_news WHERE processing_status = 'processing'
        rejected_news: 0,  // SELECT COUNT(*) FROM original_news WHERE processing_status = 'rejected'
        categories_count: categories?.total || 0,
        avg_confidence_score: 0.75, // SELECT AVG(confidence_score) FROM processed_news
        total_sources: 0, // SELECT COUNT(*) FROM news_sources
        processing_time_avg: 45, // seconds
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error in getNewsStatistics service:', error);
      return {
        success: false,
        error: NEWS_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }
} 