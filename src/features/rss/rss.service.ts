/**
 * RSS Feature Business Logic Layer
 * 
 * RSS işlemlerinin tüm iş mantığını içerir.
 * RSS kaynak yönetimi, feed okuma, web scraping ve duplicate detection işlemleri.
 * 
 */

import { RssModel } from './rss.model';
import { 
  CreateRssSourceInput, 
  UpdateRssSourceInput, 
  RssSourceQueryInput,
  RssFetchInput 
} from './rss.validation';
import { 
  RssServiceResponse,
  RssSourceWithCategory,
  RssFeedResponse,
  RssFeedItem,
  RssFetchResult,
  BulkRssFetchResult,
  ScrapedNewsContent,
  ScrapingResult
} from './rss.types';
import { RssSource, OriginalNews } from '@/core/types/database.types';

/**
 * RSS Service Class
 * 
 * Static metodlarla RSS iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class RssService {
  
  // ==================== RSS SOURCE MANAGEMENT ====================
  
  /**
   * Create RSS Source Business Logic
   * 
   * Yeni RSS kaynağı oluşturma için tüm iş mantığını yönetir:
   * - URL format kontrolü
   * - Duplicate URL kontrolü
   * - RSS feed geçerlilik testi
   * - Veritabanına kaydetme
   * 
   * @param sourceData - Validasyon geçmiş RSS kaynak verisi
   * @param createdBy - Oluşturan kullanıcı ID'si
   * @returns {Promise<RssServiceResponse<RssSource>>}
   */
  static async createRssSource(
    sourceData: CreateRssSourceInput,
    createdBy: string
  ): Promise<RssServiceResponse<RssSource>> {
    try {
      // URL duplicate kontrolü
      const existingSources = await RssModel.getRssSources({
        page: 1,
        limit: 1,
        search: sourceData.url
      });

      if (existingSources && existingSources.sources.length > 0) {
        const duplicateSource = existingSources.sources.find(
          source => source.url === sourceData.url
        );
        
        if (duplicateSource) {
          return {
            success: false,
            error: 'Bu RSS URL\'i zaten mevcut',
          };
        }
      }

      // RSS feed geçerlilik testi (basit HTTP kontrolü)
      const isValidFeed = await this.validateRssFeed(sourceData.url);
      if (!isValidFeed) {
        return {
          success: false,
          error: 'RSS feed\'e erişilemiyor veya geçersiz format',
        };
      }

      // RSS kaynağını oluştur
      const rssSource = await RssModel.createRssSource(sourceData, createdBy);

      if (!rssSource) {
        return {
          success: false,
          error: 'RSS kaynağı oluşturulamadı',
        };
      }

      return {
        success: true,
        data: rssSource,
        message: 'RSS kaynağı başarıyla oluşturuldu',
      };
    } catch (error) {
      console.error('Error in createRssSource service:', error);
      return {
        success: false,
        error: 'RSS kaynağı oluşturma işlemi sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Get RSS Sources with Pagination
   * 
   * RSS kaynaklarını sayfalama ve filtreleme ile getirme işlemi.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<RssServiceResponse<{sources: RssSourceWithCategory[], total: number, page: number, limit: number}>>}
   */
  static async getRssSources(
    queryParams: RssSourceQueryInput
  ): Promise<RssServiceResponse<{
    sources: RssSourceWithCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const result = await RssModel.getRssSources(queryParams);

      if (!result) {
        return {
          success: false,
          error: 'RSS kaynakları getirilemedi',
        };
      }

      const totalPages = Math.ceil(result.total / queryParams.limit);

      return {
        success: true,
        data: {
          sources: result.sources,
          total: result.total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getRssSources service:', error);
      return {
        success: false,
        error: 'RSS kaynakları getirme işlemi sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Get RSS Source by ID
   * 
   * ID'ye göre RSS kaynağını getirme işlemi.
   * 
   * @param id - RSS kaynak ID'si
   * @returns {Promise<RssServiceResponse<RssSourceWithCategory>>}
   */
  static async getRssSourceById(id: string): Promise<RssServiceResponse<RssSourceWithCategory>> {
    try {
      const rssSource = await RssModel.getRssSourceById(id);

      if (!rssSource) {
        return {
          success: false,
          error: 'RSS kaynağı bulunamadı',
        };
      }

      return {
        success: true,
        data: rssSource,
      };
    } catch (error) {
      console.error('Error in getRssSourceById service:', error);
      return {
        success: false,
        error: 'RSS kaynağı getirme işlemi sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Update RSS Source
   * 
   * RSS kaynağını güncelleme işlemi.
   * 
   * @param id - RSS kaynak ID'si
   * @param updateData - Güncellenecek veriler
   * @returns {Promise<RssServiceResponse<RssSource>>}
   */
  static async updateRssSource(
    id: string,
    updateData: UpdateRssSourceInput
  ): Promise<RssServiceResponse<RssSource>> {
    try {
      // Mevcut kaynağın varlığını kontrol et
      const existingSource = await RssModel.getRssSourceById(id);
      if (!existingSource) {
        return {
          success: false,
          error: 'RSS kaynağı bulunamadı',
        };
      }

      // URL değişiyorsa duplicate kontrolü
      if (updateData.url && updateData.url !== existingSource.url) {
        const existingSources = await RssModel.getRssSources({
          page: 1,
          limit: 1,
          search: updateData.url
        });

        if (existingSources && existingSources.sources.length > 0) {
          const duplicateSource = existingSources.sources.find(
            source => source.url === updateData.url && source.id !== id
          );
          
          if (duplicateSource) {
            return {
              success: false,
              error: 'Bu RSS URL\'i zaten başka bir kaynak tarafından kullanılıyor',
            };
          }
        }

        // Yeni URL'in geçerliliğini test et
        const isValidFeed = await this.validateRssFeed(updateData.url);
        if (!isValidFeed) {
          return {
            success: false,
            error: 'RSS feed\'e erişilemiyor veya geçersiz format',
          };
        }
      }

      // RSS kaynağını güncelle
      const updatedSource = await RssModel.updateRssSource(id, updateData);

      if (!updatedSource) {
        return {
          success: false,
          error: 'RSS kaynağı güncellenemedi',
        };
      }

      return {
        success: true,
        data: updatedSource,
        message: 'RSS kaynağı başarıyla güncellendi',
      };
    } catch (error) {
      console.error('Error in updateRssSource service:', error);
      return {
        success: false,
        error: 'RSS kaynağı güncelleme işlemi sırasında bir hata oluştu',
      };
    }
  }

  /**
   * Delete RSS Source
   * 
   * RSS kaynağını silme işlemi.
   * 
   * @param id - RSS kaynak ID'si
   * @returns {Promise<RssServiceResponse<void>>}
   */
  static async deleteRssSource(id: string): Promise<RssServiceResponse<void>> {
    try {
      // Mevcut kaynağın varlığını kontrol et
      const existingSource = await RssModel.getRssSourceById(id);
      if (!existingSource) {
        return {
          success: false,
          error: 'RSS kaynağı bulunamadı',
        };
      }

      // RSS kaynağını sil
      const deleted = await RssModel.deleteRssSource(id);

      if (!deleted) {
        return {
          success: false,
          error: 'RSS kaynağı silinemedi',
        };
      }

      return {
        success: true,
        message: 'RSS kaynağı başarıyla silindi',
      };
    } catch (error) {
      console.error('Error in deleteRssSource service:', error);
      return {
        success: false,
        error: 'RSS kaynağı silme işlemi sırasında bir hata oluştu',
      };
    }
  }

  // ==================== RSS FEED OPERATIONS ====================

  /**
   * Fetch RSS Feeds
   * 
   * RSS kaynaklarından haberleri çekme işlemi.
   * 
   * @param fetchParams - Çekme parametreleri
   * @returns {Promise<RssServiceResponse<BulkRssFetchResult>>}
   */
  static async fetchRssFeeds(
    fetchParams: RssFetchInput = {}
  ): Promise<RssServiceResponse<BulkRssFetchResult>> {
    try {
      const startTime = Date.now();
      
      // Çekilecek RSS kaynaklarını belirle
      let sources: RssSource[];
      
      if (fetchParams.source_id) {
        const source = await RssModel.getRssSourceById(fetchParams.source_id);
        sources = source ? [source] : [];
      } else {
        sources = await RssModel.getActiveRssSources();
      }

      if (sources.length === 0) {
        return {
          success: false,
          error: 'Aktif RSS kaynağı bulunamadı',
        };
      }

      // Her RSS kaynağından haberleri çek
      const results: RssFetchResult[] = [];
      let totalItems = 0;
      let newItems = 0;

      for (const source of sources) {
        const result = await this.fetchSingleRssSource(source, fetchParams.max_items);
        results.push(result);
        
        totalItems += result.items_count;
        newItems += result.new_items_count;
        
        // Son çekme zamanını güncelle
        if (result.success) {
          await RssModel.updateLastFetched(source.id);
        }
      }

      const executionTime = Date.now() - startTime;
      const successfulSources = results.filter(r => r.success).length;

      return {
        success: true,
        data: {
          total_sources: sources.length,
          successful_sources: successfulSources,
          failed_sources: sources.length - successfulSources,
          total_items: totalItems,
          new_items: newItems,
          results,
          execution_time: executionTime,
        },
        message: `${successfulSources}/${sources.length} RSS kaynağından ${newItems} yeni haber çekildi`,
      };
    } catch (error) {
      console.error('Error in fetchRssFeeds service:', error);
      return {
        success: false,
        error: 'RSS feed çekme işlemi sırasında bir hata oluştu',
      };
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate RSS Feed
   * 
   * RSS feed'in geçerliliğini kontrol eder.
   * 
   * @param url - RSS feed URL'i
   * @returns {Promise<boolean>}
   * @private
   */
  private static async validateRssFeed(url: string): Promise<boolean> {
    try {
      // Basit HTTP kontrolü - gerçek RSS parsing sonra eklenecek
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'AI News Bot/1.0',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating RSS feed:', error);
      return false;
    }
  }

  /**
   * Fetch Single RSS Source
   * 
   * Tek bir RSS kaynağından haberleri çeker.
   * 
   * @param source - RSS kaynağı
   * @param maxItems - Maksimum haber sayısı
   * @returns {Promise<RssFetchResult>}
   * @private
   */
  private static async fetchSingleRssSource(
    source: RssSource,
    maxItems: number = 10
  ): Promise<RssFetchResult> {
    const startTime = Date.now();
    
    try {
      // RSS feed'i çek (şimdilik placeholder)
      // Gerçek RSS parsing ve web scraping sonraki adımda eklenecek
      
      return {
        source_id: source.id,
        source_name: source.name,
        success: true,
        items_count: 0,
        new_items_count: 0,
        fetch_time: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`Error fetching RSS source ${source.name}:`, error);
      
      return {
        source_id: source.id,
        source_name: source.name,
        success: false,
        items_count: 0,
        new_items_count: 0,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        fetch_time: Date.now() - startTime,
      };
    }
  }
} 