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

      // 2. İçerik validasyonu
      const validation = await this.validateNewsContent(
        originalNews, 
        generationInput.available_categories
      );

      if (!validation.is_valid || !validation.is_suitable) {
        // Validation failed - rejected status
        await NewsModel.updateOriginalNewsStatus(originalNews.id, 'rejected', validation.rejection_reasons.join(', '));
        
        return {
          status: 'rejected',
          rejection_reason: validation.rejection_reasons.join(', '),
          processing_time: Date.now() - startTime,
        };
      }

      // 3. LangGraph research request hazırla
      const researchRequest: LangGraphResearchRequest = {
        query: `${originalNews.title}\n\n${originalNews.content || ''}`,
        max_results: generationInput.max_sources || NEWS_GENERATION_CONFIG.MAX_SOURCES,
        research_depth: generationInput.research_depth || 'standard',
        language: 'tr',
      };

      // 4. LangGraph ile araştırma yap
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

      // 5. LangGraph JSON response'unu parse et
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

      // 6. Kategori kontrolü - NONE ise skipped yap
      if (processedContent.category_slug === 'NONE' || !processedContent.category_match) {
        await NewsModel.updateOriginalNewsStatus(originalNews.id, 'rejected', NEWS_ERROR_MESSAGES.GENERATION_NO_CATEGORY_MATCH);
        
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.GENERATION_NO_CATEGORY_MATCH,
          processing_time: Date.now() - startTime,
        };
      }

      // 7. Confidence kontrolü
      if (processedContent.confidence_score < NEWS_VALIDATION_RULES.MIN_CONFIDENCE) {
        const rejectionReason = `Düşük güven skoru: ${processedContent.confidence_score}`;
        await NewsModel.updateOriginalNewsStatus(originalNews.id, 'rejected', rejectionReason);
        
        return {
          status: 'rejected',
          rejection_reason: rejectionReason,
          processing_time: Date.now() - startTime,
        };
      }

      // 8. Veritabanına kaydet
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
      
      // JSON parse et
      let parsedResponse: any;
      try {
        // JSON'u temizle (markdown kod blokları varsa)
        const cleanJson = answerText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedResponse = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('Failed to parse LangGraph JSON response:', parseError);
        return null;
      }

      // Gerekli alanları kontrol et
      if (!parsedResponse.title || !parsedResponse.content) {
        console.error('Missing required fields in LangGraph response');
        return null;
      }

      // Kategori eşleştirme
      let categoryMatch = null;
      if (parsedResponse.category_slug && parsedResponse.category_slug !== 'NONE') {
        categoryMatch = availableCategories.find(cat => cat.slug === parsedResponse.category_slug);
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
      };
    } catch (error) {
      console.error('Error parsing LangGraph JSON response:', error);
      return null;
    }
  }

  // ==================== CONTENT VALIDATION ====================

  /**
   * Validate News Content Quality and Suitability
   * 
   * Haber içeriğinin kalitesini ve işlenebilirliğini kontrol eder.
   * 
   * @param originalNews - Orijinal haber
   * @param availableCategories - Mevcut kategoriler
   * @returns {Promise<NewsValidationResult>}
   */
  static async validateNewsContent(
    originalNews: OriginalNews,
    availableCategories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): Promise<NewsValidationResult> {
    const rejectionReasons: string[] = [];
    let qualityScore = 1.0;

    // İçerik analizi
    const content = originalNews.content || '';
    const title = originalNews.title;
    
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const questionCount = (content.match(/\?/g) || []).length;

    // 1. Uzunluk kontrolü
    if (content.length < NEWS_GENERATION_CONFIG.MIN_CONTENT_LENGTH) {
      rejectionReasons.push(NEWS_ERROR_MESSAGES.GENERATION_CONTENT_TOO_SHORT);
      qualityScore -= 0.4;
    }

    // 2. Video içerik tespiti
    const hasVideoContent = NEWS_GENERATION_CONFIG.VIDEO_KEYWORDS.some(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase()) ||
      title.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasVideoContent) {
      rejectionReasons.push(NEWS_ERROR_MESSAGES.GENERATION_VIDEO_CONTENT);
      qualityScore -= 0.5;
    }

    // 3. Placeholder içerik tespiti
    const hasPlaceholderContent = NEWS_GENERATION_CONFIG.PLACEHOLDER_KEYWORDS.some(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasPlaceholderContent) {
      rejectionReasons.push(NEWS_ERROR_MESSAGES.GENERATION_PLACEHOLDER_CONTENT);
      qualityScore -= 0.3;
    }

    // 4. Soru oranı kontrolü
    const questionRatio = questionCount / Math.max(sentenceCount, 1);
    if (questionCount > NEWS_GENERATION_CONFIG.QUESTION_THRESHOLD || questionRatio > NEWS_VALIDATION_RULES.MAX_QUESTION_RATIO) {
      rejectionReasons.push(NEWS_ERROR_MESSAGES.GENERATION_QUESTION_ONLY);
      qualityScore -= 0.3;
    }

    // 5. Kategori eşleştirme (AI ile)
    const categoryMatch = await this.findBestCategoryMatch(originalNews, availableCategories);
    
    if (!categoryMatch) {
      rejectionReasons.push(NEWS_ERROR_MESSAGES.GENERATION_NO_CATEGORY_MATCH);
      qualityScore -= 0.4;
    }

    const isValid = rejectionReasons.length === 0;
    const isSuitable = qualityScore >= NEWS_VALIDATION_RULES.MIN_CONFIDENCE;

    return {
      is_valid: isValid,
      is_suitable: isSuitable,
      category_match: categoryMatch || undefined,
      rejection_reasons: rejectionReasons,
      quality_score: Math.max(0, qualityScore),
      content_analysis: {
        word_count: wordCount,
        sentence_count: sentenceCount,
        question_count: questionCount,
        has_video_content: hasVideoContent,
        has_placeholder_content: hasPlaceholderContent,
      },
    };
  }

  // ==================== CATEGORY MATCHING ====================

  // ==================== HELPER METHODS ====================

  /**
   * Find Best Category Match using AI
   * 
   * AI kullanarak haberin en uygun kategorisini bulur.
   * 
   * @param originalNews - Orijinal haber
   * @param categories - Mevcut kategoriler
   * @returns {Promise<Pick<NewsCategory, 'id' | 'name' | 'slug'> | null>}
   */
  static async findBestCategoryMatch(
    originalNews: OriginalNews,
    categories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]
  ): Promise<Pick<NewsCategory, 'id' | 'name' | 'slug'> | null> {
    // Basit kategori eşleştirme - ileride AI ile geliştirilebilir
    const content = (originalNews.title + ' ' + (originalNews.content || '')).toLowerCase();
    
    // Anahtar kelime bazlı basit eşleştirme
    for (const category of categories) {
      const categoryKeywords = category.name.toLowerCase().split(' ');
      const hasMatch = categoryKeywords.some(keyword => content.includes(keyword));
      
      if (hasMatch) {
        return category;
      }
    }

    // Varsayılan kategori döndür (ilk kategori)
    return categories[0] || null;
  }

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
      // 1. Differences'ı string'e çevir
      const differencesAnalysis = generatedContent.differences_found && generatedContent.differences_found.length > 0
        ? JSON.stringify(generatedContent.differences_found)
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
        differences_analysis: differencesAnalysis || undefined,
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