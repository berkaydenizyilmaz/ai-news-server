/**
 * News Generation Service
 * 
 * AI-powered news generation using external LangGraph service.
 * RSS haberlerinden kapsamlı, çok kaynaklı haberler üretir.
 */

import { 
  NewsGenerationRequest,
  NewsGenerationResult,
  NewsValidationResult
} from './news.types';
import { 
  NEWS_GENERATION_CONFIG,
  NEWS_VALIDATION_RULES,
  NEWS_ERROR_MESSAGES
} from './news.constants';
import { 
  OriginalNews, 
  NewsCategory, 
  ProcessedNews,
  NewsSource
} from '@/core/types/database.types';
import { NewsModel } from './news.model';
import { LangGraphService, LangGraphResearchRequest } from '@/core/utils/langgraph.util';

/**
 * News Generation Service Class
 * 
 * LangGraph tabanlı haber üretimi için ana servis sınıfı.
 * External LangGraph service'ini kullanarak kapsamlı haberler üretir.
 */
export class NewsGenerationService {

  // ==================== MAIN GENERATION WORKFLOW ====================

  /**
   * Generate News from Original RSS Content
   * 
   * Ana haber üretim workflow'u. RSS haberinden kapsamlı haber üretir.
   * 
   * @param generationInput - Haber üretim parametreleri
   * @returns {Promise<NewsGenerationResult>}
   */
  static async generateNews(generationInput: NewsGenerationRequest): Promise<NewsGenerationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Orijinal haberi getir
      const originalNews = await NewsModel.getOriginalNewsById(generationInput.original_news_id);
      if (!originalNews) {
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.NEWS_NOT_FOUND,
          processing_time: Date.now() - startTime,
        };
      }

      // 2. LangGraph research request hazırla
      const researchRequest: LangGraphResearchRequest = {
        query: `${originalNews.title}\n\n${originalNews.content || ''}`,
        max_results: generationInput.max_sources || NEWS_GENERATION_CONFIG.MAX_SOURCES,
        research_depth: generationInput.research_depth || 'standard',
      };

      // 3. LangGraph ile araştırma yap - AI karar verecek
      const researchResponse = await LangGraphService.researchNewsTopic(
        researchRequest,
        generationInput.available_categories
      );

      if (!researchResponse.success || !researchResponse.answer) {
        return {
          status: 'rejected',
          rejection_reason: researchResponse.error || NEWS_ERROR_MESSAGES.GENERATION_FAILED,
          processing_time: Date.now() - startTime,
        };
      }

      // 4. LangGraph JSON response'unu parse et
      const processedContent = await this.parseLangGraphJsonResponse(
        researchResponse, 
        generationInput.available_categories
      );

      if (!processedContent) {
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.GENERATION_FAILED,
          processing_time: Date.now() - startTime,
        };
      }

      // 5. AI'nın kararını kontrol et
      if (processedContent.is_suitable === false) {
        return {
          status: 'rejected',
          rejection_reason: processedContent.rejection_reason || 'AI deemed content unsuitable',
          processing_time: Date.now() - startTime,
        };
      }

      // 6. Kategori kontrolü - AI NONE dönerse reject
      if (processedContent.category_slug === 'NONE' || !processedContent.category_match) {
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.GENERATION_NO_CATEGORY_MATCH,
          processing_time: Date.now() - startTime,
        };
      }

      // 7. Veritabanına kaydet
      const savedNews = await this.saveGeneratedNews(
        originalNews,
        processedContent,
        processedContent.category_match!
      );

      if (!savedNews.processed_news) {
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.NEWS_CREATE_FAILED,
          processing_time: Date.now() - startTime,
        };
      }

      return {
        status: 'success',
        processed_news: savedNews.processed_news,
        sources: savedNews.sources,
        processing_time: Date.now() - startTime,
        confidence_score: processedContent.confidence_score,
      };

    } catch (error) {
      console.error('Error in generateNews:', error);
      return {
        status: 'rejected',
        rejection_reason: NEWS_ERROR_MESSAGES.GENERATION_FAILED,
        processing_time: Date.now() - startTime,
      };
    }
  }

  // ==================== LANGGRAPH RESPONSE PROCESSING ====================

  /**
   * Parse LangGraph JSON Research Response
   * 
   * LangGraph'dan gelen JSON response'u parse ederek processed news formatına çevirir.
   * 
   * @param response - LangGraph research response
   * @param availableCategories - Mevcut kategoriler
   * @returns {Promise<any>}
   */
  static async parseLangGraphJsonResponse(
    response: any,
    availableCategories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): Promise<any> {
    try {
      const answerText = response.answer || '';
      
      // JSON parse et - daha güçlü parsing
      let parsedResponse: any;
      try {
        // 1. JSON'u temizle (markdown kod blokları varsa)
        let cleanJson = answerText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // 2. Çoklu JSON objesi varsa ilkini al
        const jsonMatch = cleanJson.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          cleanJson = jsonMatch[0];
        }
        
        // 3. Trailing comma'ları temizle
        cleanJson = cleanJson.replace(/,(\s*[}\]])/g, '$1');
        
        // 4. Control karakterleri ve kaçış karakterlerini düzelt
        cleanJson = cleanJson
          .replace(/[\x00-\x1F\x7F]/g, '') // Control karakterleri temizle
          .replace(/\\\\/g, '\\') // Çift backslash'ları tek yap
          .replace(/\\"/g, '"') // Escaped quotes'ları düzelt
          .replace(/\\n/g, '\\n') // Newline'ları JSON uyumlu hale getir
          .replace(/\\t/g, '\\t') // Tab'ları JSON uyumlu hale getir
          .replace(/\\r/g, '\\r'); // Carriage return'leri JSON uyumlu hale getir
        
        // 5. JSON parse et
        parsedResponse = JSON.parse(cleanJson);
        
      } catch (parseError) {
        console.error('Failed to parse LangGraph JSON response:', parseError);
        console.error('Raw response (full):', answerText); // Tam response'u göster
        
        // Fallback: Regex ile temel alanları çıkarmaya çalış
        try {
          const titleMatch = answerText.match(/"title"\s*:\s*"([^"]+)"/);
          const contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"/);
          const suitableMatch = answerText.match(/"is_suitable"\s*:\s*(true|false)/);
          const categoryMatch = answerText.match(/"category_slug"\s*:\s*"([^"]+)"/);
          
          console.log('🔍 Fallback parsing sonuçları:');
          console.log('- Title:', titleMatch ? titleMatch[1].substring(0, 50) + '...' : 'BULUNAMADI');
          console.log('- Category slug:', categoryMatch ? categoryMatch[1] : 'BULUNAMADI');
          console.log('- Is suitable:', suitableMatch ? suitableMatch[1] : 'BULUNAMADI');
          
          if (suitableMatch && suitableMatch[1] === 'false') {
            const reasonMatch = answerText.match(/"rejection_reason"\s*:\s*"([^"]+)"/);
            return {
              is_suitable: false,
              rejection_reason: reasonMatch ? reasonMatch[1] : 'Content deemed unsuitable by AI',
            };
          }
          
          if (titleMatch && contentMatch) {
            console.log('⚠️ Fallback parsing kullanıldı');
            const categorySlug = categoryMatch ? categoryMatch[1] : 'NONE';
            return {
              title: titleMatch[1],
              content: contentMatch[1],
              summary: '',
              category_slug: categorySlug,
              confidence_score: 0.5,
              sources: [],
              is_suitable: true,
              source_conflicts: '',
            };
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
        }
        
        return null;
      }

      // Gerekli alanları kontrol et
      // Eğer AI uygun değil diyorsa, title/content zorunlu değil
      if (parsedResponse.is_suitable !== false && (!parsedResponse.title || !parsedResponse.content)) {
        console.error('Missing required fields in LangGraph response');
        return null;
      }

      // Eğer uygun değilse, sadece uygunluk bilgilerini döndür
      if (parsedResponse.is_suitable === false) {
        return {
          is_suitable: false,
          rejection_reason: parsedResponse.rejection_reason || 'Content deemed unsuitable by AI',
        };
      }

      // Kategori eşleştirme
      let categoryMatch = null;
      if (parsedResponse.category_slug && parsedResponse.category_slug !== 'NONE') {
        console.log(`🔍 AI tarafından belirtilen kategori: "${parsedResponse.category_slug}"`);
        console.log(`📋 Mevcut kategoriler:`, availableCategories.map(cat => `${cat.name} (${cat.slug})`));
        categoryMatch = availableCategories.find(cat => cat.slug === parsedResponse.category_slug);
        console.log(`✅ Kategori eşleştirme sonucu:`, categoryMatch ? `${categoryMatch.name} (${categoryMatch.slug})` : 'BULUNAMADI');
      } else {
        console.log(`❌ AI kategori belirtmedi veya NONE döndürdü: "${parsedResponse.category_slug}"`);
      }

      // Slug oluştur (title'dan)
      const slug = parsedResponse.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      return {
        title: parsedResponse.title,
        slug: slug,
        content: parsedResponse.content,
        summary: parsedResponse.summary || '',
        category_id: categoryMatch?.id,
        category_match: categoryMatch,
        category_slug: parsedResponse.category_slug,
        confidence_score: parsedResponse.confidence_score || 0.5,
        sources_used: (parsedResponse.sources || []).map((source: any) => ({
          name: source.title || 'Bilinmeyen Kaynak',
          url: source.url || '#',
          snippet: source.snippet || '',
          reliability_score: source.reliability_score || 0.5,
        })),
        processing_time: response.processing_time || 0,
        is_suitable: parsedResponse.is_suitable,
        rejection_reason: parsedResponse.rejection_reason,
        source_conflicts: parsedResponse.source_conflicts || '',
      };
    } catch (error) {
      console.error('Error parsing LangGraph JSON response:', error);
      return null;
    }
  }

  // ==================== CONTENT VALIDATION - DEPRECATED ====================
  // Bu metodlar artık kullanılmıyor - AI direkt karar veriyor

  /*
  static async validateNewsContent(
    originalNews: OriginalNews,
    availableCategories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): Promise<NewsValidationResult> {
    // DEPRECATED - AI artık bu kararı veriyor
  }

  static async findBestCategoryMatch(
    originalNews: OriginalNews,
    categories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): Promise<Pick<NewsCategory, 'id' | 'name' | 'slug'> | null> {
    // DEPRECATED - AI artık kategori eşleştirmesi yapıyor
  }
  */

  // ==================== HELPER METHODS ====================

  /**
   * Save Generated News to Database
   * 
   * Üretilen haberi ve ilişkili verileri veritabanına kaydeder.
   * 
   * @param originalNews - Orijinal haber
   * @param generatedContent - AI tarafından üretilen içerik
   * @param category - Seçilen kategori
   * @returns {Promise<any>}
   */
  static async saveGeneratedNews(
    originalNews: OriginalNews,
    generatedContent: any,
    category: Pick<NewsCategory, 'id' | 'name' | 'slug'>
  ): Promise<{
    processed_news?: ProcessedNews;
    sources?: NewsSource[];
  }> {
    try {
      // 1. Source conflicts'ı kaydet
      const sourceConflictsAnalysis = generatedContent.source_conflicts && generatedContent.source_conflicts.trim()
        ? generatedContent.source_conflicts
        : null;

      // 2. Processed news oluştur
      const processedNews = await NewsModel.createProcessedNews({
        original_news_id: originalNews.id,
        title: generatedContent.title,
        slug: generatedContent.slug,
        content: generatedContent.content,
        summary: generatedContent.summary,
        image_url: originalNews.image_url, // RSS'den gelen resim
        category_id: category.id,
        confidence_score: generatedContent.confidence_score,
        differences_analysis: sourceConflictsAnalysis || undefined,
      });

      if (!processedNews) {
        return {};
      }

      // 3. Sources kaydet
      const sources = generatedContent.sources_used?.map((source: any) => ({
        processed_news_id: processedNews.id,
        source_name: source.name,
        source_url: source.url,
        is_primary: false,
      })) || [];

      const savedSources = await NewsModel.createNewsSources(sources);

      // 4. OriginalNews status'unu completed yap
      await NewsModel.updateOriginalNewsStatus(originalNews.id, 'completed');

      return {
        processed_news: processedNews,
        sources: savedSources || [],
      };
    } catch (error) {
      console.error('Error saving generated news:', error);
      
      // Hata durumunda OriginalNews status'unu failed yap
      try {
        await NewsModel.updateOriginalNewsStatus(originalNews.id, 'failed');
      } catch (statusError) {
        console.error('Error updating original news status:', statusError);
      }
      
      return {};
    }
  }
} 