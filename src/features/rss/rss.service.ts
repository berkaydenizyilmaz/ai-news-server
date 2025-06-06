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
import { RssParserUtil } from '@/core/utils/rss-parser.util';
import { WebScraperUtil } from '@/core/utils/web-scraper.util';
import { EmbeddingUtil } from '@/core/utils/embedding.util';

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

      // RSS feed geçerlilik testi (gerçek RSS parsing)
      const isValidFeed = await RssParserUtil.validateRssUrl(sourceData.url);
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
        const isValidFeed = await RssParserUtil.validateRssUrl(updateData.url);
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
   * Fetch Single RSS Source
   * 
   * Tek bir RSS kaynağından haberleri çeker, web scraping yapar ve duplicate detection uygular.
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
      console.log(`RSS kaynağından haber çekiliyor: ${source.name}`);
      
      // 1. RSS feed'i parse et
      const feedData = await RssParserUtil.parseFeed(source.url);
      
      if (!feedData.items || feedData.items.length === 0) {
        return {
          source_id: source.id,
          source_name: source.name,
          success: false,
          items_count: 0,
          new_items_count: 0,
          error: 'RSS feed\'de haber bulunamadı',
          fetch_time: Date.now() - startTime,
        };
      }

      // 2. Maksimum item sayısını sınırla
      const itemsToProcess = feedData.items.slice(0, maxItems);
      let newItemsCount = 0;

      // 3. Her RSS item'ı için işlem yap
      for (const item of itemsToProcess) {
        try {
          // URL duplicate kontrolü
          const urlExists = await RssModel.checkNewsUrlExists(item.link);
          if (urlExists) {
            console.log(`URL zaten mevcut, atlanıyor: ${item.link}`);
            continue;
          }

          // Web scraping ile tam içeriği çek
          const scrapingResult = await WebScraperUtil.scrapeNewsContent(item.link);
          
          if (!scrapingResult.success || !scrapingResult.content) {
            console.log(`Scraping başarısız: ${item.link} - ${scrapingResult.error}`);
            continue;
          }

          // Duplicate detection için embedding oluştur
          const contentForEmbedding = `${scrapingResult.content.title} ${scrapingResult.content.content}`;
          const embeddingResult = await EmbeddingUtil.generateEmbedding(contentForEmbedding);
          
          let isDuplicate = false;
          
          if (embeddingResult.success && embeddingResult.embedding) {
            // Benzer haberler var mı kontrol et
            const similarNews = await RssModel.findSimilarNews(embeddingResult.embedding);
            
            if (similarNews.length > 0) {
              console.log(`Benzer haber bulundu, atlanıyor: ${item.title} (Benzerlik: ${similarNews[0].similarity})`);
              isDuplicate = true;
            }
          }

          if (!isDuplicate) {
            // Haberi veritabanına kaydet
            const newsData = {
              title: scrapingResult.content.title,
              content: scrapingResult.content.content,
              summary: scrapingResult.content.summary || item.description,
              original_url: item.link,
              image_url: scrapingResult.content.image_url,
              author: scrapingResult.content.author || item.author,
              published_date: scrapingResult.content.published_date || item.pubDate,
              rss_source_id: source.id,
              content_embedding: embeddingResult.embedding,
              processed_time: scrapingResult.content.scrape_time + (embeddingResult.processing_time || 0),
            };

            const savedNews = await RssModel.createOriginalNews(newsData);
            
            if (savedNews) {
              newItemsCount++;
              console.log(`Yeni haber kaydedildi: ${scrapingResult.content.title}`);
            }
          }
        } catch (itemError) {
          console.error(`Item işleme hatası: ${item.link}`, itemError);
          continue;
        }
      }

      return {
        source_id: source.id,
        source_name: source.name,
        success: true,
        items_count: itemsToProcess.length,
        new_items_count: newItemsCount,
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