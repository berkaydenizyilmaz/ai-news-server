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
  NewsSource,
  NewsDifference
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
      const researchResponse = await LangGraphService.researchNewsTopic(researchRequest);
      
      if (!researchResponse.success || !researchResponse.answer) {
        return {
          status: 'rejected',
          rejection_reason: researchResponse.error || NEWS_ERROR_MESSAGES.GENERATION_FAILED,
          processing_time: Date.now() - startTime,
        };
      }

      // 5. LangGraph response'unu işle
      const processedContent = await this.parseLangGraphResponse(
        researchResponse, 
        validation.category_match!
      );

      if (!processedContent) {
        return {
          status: 'rejected',
          rejection_reason: NEWS_ERROR_MESSAGES.GENERATION_FAILED,
          processing_time: Date.now() - startTime,
        };
      }

      // 6. Veritabanına kaydet
      const savedNews = await this.saveGeneratedNews(
        originalNews,
        processedContent,
        validation.category_match!
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
        differences: savedNews.differences,
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
   * Parse LangGraph Research Response
   * 
   * LangGraph'dan gelen response'u parse ederek processed news formatına çevirir.
   * 
   * @param response - LangGraph research response
   * @param category - Seçilen kategori
   * @returns {Promise<any>}
   */
  static async parseLangGraphResponse(
    response: any,
    category: Pick<NewsCategory, 'id' | 'name' | 'slug'>
  ): Promise<any> {
    try {
      const content = response.answer || '';
      const sources = response.sources || [];
      const confidence = response.confidence_score || 0.8;

      // Content'ten başlık ve gövdeyi ayırmaya çalış
      const lines = content.split('\n').filter((line: string) => line.trim());
      const title = lines[0]?.replace(/^#+\s*/, '').trim() || 'AI Tarafından Üretilen Başlık';
      
      // İlk satırı başlık olarak kabul et, kalanını content olarak al
      const mainContent = lines.slice(1).join('\n').trim() || content;
      
      // Özet oluştur (ilk 2-3 cümle)
      const sentences = mainContent.split(/[.!?]+/).filter((s: string) => s.trim());
      const summary = sentences.slice(0, 3).join('. ').trim() + '.';

      return {
        title: title,
        content: mainContent,
        summary: summary,
        category_id: category.id,
        confidence_score: confidence,
        sources_used: sources.map((source: any) => ({
          name: source.title || 'Bilinmeyen Kaynak',
          url: source.url || '#',
        })),
        differences_found: [], // LangGraph'dan gelen analiz varsa buraya eklenebilir
        processing_time: response.processing_time || 0,
      };
    } catch (error) {
      console.error('Error parsing LangGraph response:', error);
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
    differences?: NewsDifference[];
  }> {
    try {
      // 1. Processed news oluştur
      const processedNews = await NewsModel.createProcessedNews({
        title: generatedContent.title,
        content: generatedContent.content,
        summary: generatedContent.summary,
        image_url: originalNews.image_url,
        category_id: category.id,
      });

      if (!processedNews) {
        return {};
      }

      // 2. Sources kaydet
      const sources = generatedContent.sources_used?.map((source: any) => ({
        processed_news_id: processedNews.id,
        source_name: source.name,
        source_url: source.url,
        is_primary: false,
      })) || [];

      const savedSources = await NewsModel.createNewsSources(sources);

      // 3. Differences kaydet
      const differences = generatedContent.differences_found?.map((diff: any) => ({
        news_id: processedNews.id,
        title: diff.title,
        description: diff.description,
      })) || [];

      const savedDifferences = await NewsModel.createNewsDifferences(differences);

      return {
        processed_news: processedNews,
        sources: savedSources || [],
        differences: savedDifferences || [],
      };
    } catch (error) {
      console.error('Error saving generated news:', error);
      return {};
    }
  }
}