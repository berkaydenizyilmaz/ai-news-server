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

      // 2. LangGraph research request hazırla - Sadece başlık ve link gönder
      const researchRequest: LangGraphResearchRequest = {
        query: `Haber Başlığı: ${originalNews.title}\nKaynak Link: ${originalNews.original_url}`,
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
      console.log('🔍 AI Response parsing başlatılıyor...');
      
      let parsedResponse: any;
      
      try {
        // 1. JSON'u temizle ve parse et
        let cleanJson = answerText.trim();
        
        // Markdown kod blokları varsa temizle
        cleanJson = cleanJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // İlk { ile son } arasındaki kısmı al
        const startIndex = cleanJson.indexOf('{');
        const lastIndex = cleanJson.lastIndexOf('}');
        
        if (startIndex === -1 || lastIndex === -1) {
          throw new Error('JSON başlangıç veya bitiş bulunamadı');
        }
        
        cleanJson = cleanJson.substring(startIndex, lastIndex + 1);
        
        // JSON parse et
        parsedResponse = JSON.parse(cleanJson);
        console.log('✅ JSON başarıyla parse edildi');
        
      } catch (parseError) {
        console.error('❌ JSON parsing hatası:', parseError);
        console.error('Raw response:', answerText.substring(0, 500) + '...');
        
        // Fallback: Manuel regex parsing
        return this.fallbackParseResponse(answerText, availableCategories);
      }
      
      // 2. Uygunluk kontrolü
      if (parsedResponse.is_suitable === false) {
        console.log('⚠️ AI haberi uygun görmedi:', parsedResponse.rejection_reason);
        return {
          is_suitable: false,
          rejection_reason: parsedResponse.rejection_reason || 'AI tarafından uygun görülmedi',
        };
      }
      
      // 3. Gerekli alanları kontrol et
      if (!parsedResponse.title || !parsedResponse.content) {
        console.error('❌ Gerekli alanlar eksik - title veya content yok');
        return this.fallbackParseResponse(answerText, availableCategories);
      }
      
      // 4. Kategori eşleştirme
      const categorySlug = parsedResponse.category_slug || 'genel';
      const categoryMatch = availableCategories.find(cat => cat.slug === categorySlug);
      
      if (!categoryMatch) {
        console.log(`⚠️ Kategori bulunamadı: "${categorySlug}", genel kategorisi aranıyor...`);
        const generalCategory = availableCategories.find(cat => cat.slug === 'genel');
        if (!generalCategory) {
          console.error('❌ Genel kategori de bulunamadı!');
          return null;
        }
      }
      
      console.log(`✅ Kategori eşleşti: ${categoryMatch?.name || 'genel'} (${categorySlug})`);
      
      // 5. Slug oluştur
      const slug = parsedResponse.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      
      // 6. Sources'ları düzenle
      const sources = (parsedResponse.sources || []).map((source: any) => ({
        name: source.name || 'Bilinmeyen Kaynak',
        url: source.url || '#',
        snippet: source.snippet || '',
        reliability_score: source.reliability_score || 0.8,
      }));
      
      console.log(`✅ Parse tamamlandı - ${sources.length} kaynak bulundu`);
      
      return {
        title: parsedResponse.title,
        slug: slug,
        content: parsedResponse.content,
        summary: parsedResponse.summary || '',
        category_id: categoryMatch?.id,
        category_match: categoryMatch,
        category_slug: categorySlug,
        confidence_score: parsedResponse.confidence_score || 0.8,
        sources_used: sources,
        is_suitable: true,
        source_conflicts: parsedResponse.source_conflicts || '',
      };
      
    } catch (error) {
      console.error('❌ Parse genel hatası:', error);
      return null;
    }
  }
  
  /**
   * Fallback parsing - JSON parse edilemediğinde regex ile parse et
   */
  private static fallbackParseResponse(
    answerText: string,
    availableCategories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): any {
    try {
      console.log('🔧 Fallback parsing başlatılıyor...');
      
      // Temel alanları regex ile çıkar
      const titleMatch = answerText.match(/"title"\s*:\s*"([^"]+)"/);
      const summaryMatch = answerText.match(/"summary"\s*:\s*"([^"]+)"/);
      const categoryMatch = answerText.match(/"category_slug"\s*:\s*"([^"]+)"/);
      const suitableMatch = answerText.match(/"is_suitable"\s*:\s*(true|false)/);
      const confidenceMatch = answerText.match(/"confidence_score"\s*:\s*([0-9.]+)/);
      
      // Content için daha güçlü regex - farklı field sıralarını destekle
      let contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"summary"/);
      if (!contentMatch) {
        contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"category_slug"/);
      }
      if (!contentMatch) {
        contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"confidence_score"/);
      }
      if (!contentMatch) {
        contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"source_conflicts"/);
      }
      if (!contentMatch) {
        contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"sources"/);
      }
      if (!contentMatch) {
        // Son çare: content'in başından bir sonraki field'a kadar
        contentMatch = answerText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"/);
      }
      
      // Uygunluk kontrolü
      if (suitableMatch && suitableMatch[1] === 'false') {
        const reasonMatch = answerText.match(/"rejection_reason"\s*:\s*"([^"]+)"/);
        return {
          is_suitable: false,
          rejection_reason: reasonMatch ? reasonMatch[1] : 'AI tarafından uygun görülmedi',
        };
      }
      
      if (!titleMatch || !contentMatch) {
        console.error('❌ Fallback parsing başarısız - temel alanlar bulunamadı');
        console.log('Title bulundu:', !!titleMatch);
        console.log('Content bulundu:', !!contentMatch);
        return null;
      }
      
      // Sources'ları parse et
      const sources: any[] = [];
      const sourcesMatch = answerText.match(/"sources"\s*:\s*\[([\s\S]*?)\]/);
      if (sourcesMatch) {
        const sourcesText = sourcesMatch[1];
        const sourcePattern = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"([^"]+)"\s*,\s*"snippet"\s*:\s*"([^"]+)"\s*(?:,\s*"reliability_score"\s*:\s*([0-9.]+))?\s*\}/g;
        let sourceMatch;
        while ((sourceMatch = sourcePattern.exec(sourcesText)) !== null) {
          sources.push({
            name: sourceMatch[1],
            url: sourceMatch[2],
            snippet: sourceMatch[3],
            reliability_score: sourceMatch[4] ? parseFloat(sourceMatch[4]) : 0.8
          });
        }
      }
      
      // Kategori eşleştirme
      const categorySlug = categoryMatch ? categoryMatch[1] : 'genel';
      const categoryMatchResult = availableCategories.find(cat => cat.slug === categorySlug);
      
      const slug = titleMatch[1]
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
      
      console.log(`✅ Fallback parsing tamamlandı - ${sources.length} kaynak`);
      
      return {
        title: titleMatch[1],
        slug: slug,
        content: contentMatch[1],
        summary: summaryMatch ? summaryMatch[1] : titleMatch[1].substring(0, 200) + '...',
        category_id: categoryMatchResult?.id,
        category_match: categoryMatchResult,
        category_slug: categorySlug,
        confidence_score: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        sources_used: sources,
        is_suitable: true,
        source_conflicts: '',
      };
      
    } catch (error) {
      console.error('❌ Fallback parsing de başarısız:', error);
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