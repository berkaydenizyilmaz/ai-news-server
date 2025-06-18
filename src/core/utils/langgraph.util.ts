/**
 * LangGraph External Service Integration Utility
 * 
 * Ayrı LangGraph projesine HTTP istekleri gönderir.
 * Research agent'ı kullanarak haber araştırması yapar.
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import config from '@/core/config';

// ==================== VALIDATION SCHEMAS ====================

/**
 * LangGraph Research Request Validation Schema
 */
export const langGraphResearchSchema = z.object({
  query: z.string().min(10, 'Araştırma sorgusu en az 10 karakter olmalıdır').max(2000, 'Araştırma sorgusu çok uzun'),
  max_results: z.number().int().min(1).max(20).optional().default(5),
  research_depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard'),
  language: z.enum(['tr', 'en']).optional().default('tr'),
});

// ==================== TYPE DEFINITIONS ====================

export interface LangGraphResearchRequest {
  query: string;
  max_results?: number;
  research_depth?: 'quick' | 'standard' | 'deep';
  language?: 'tr' | 'en';
}

export interface LangGraphResearchResponse {
  success: boolean;
  thread_id?: string;
  answer?: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    reliability_score?: number;
  }>;
  confidence_score?: number;
  processing_time?: number;
  error?: string;
}

export interface LangGraphStreamResponse {
  type: 'start' | 'data' | 'end' | 'error';
  content?: string;
  metadata?: any;
}

// Type inference from Zod schema
export type LangGraphResearchInput = z.infer<typeof langGraphResearchSchema>;

// ==================== LANGGRAPH SERVICE CLASS ====================

export class LangGraphService {
  private static baseUrl = config.aiBackend.baseUrl;
  private static timeout = 30000; // 30 saniye (test için kısaltıldı)

  /**
   * Research News Topic using LangGraph Agent
   * 
   * Haber konusu için kapsamlı araştırma yapar.
   * 
   * @param request - Araştırma isteği
   * @param availableCategories - Mevcut haber kategorileri
   * @returns {Promise<LangGraphResearchResponse>}
   */
  static async researchNewsTopic(
    request: LangGraphResearchRequest,
    availableCategories?: Array<{id: string, name: string, slug: string}>
  ): Promise<LangGraphResearchResponse> {
    try {
      // Input validation
      const validationResult = langGraphResearchSchema.safeParse(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        };
      }

      const validatedRequest = validationResult.data;

      // LangGraph thread oluştur
      const threadResponse = await this.createThread();
      if (!threadResponse.success || !threadResponse.thread_id) {
        throw new Error('Failed to create LangGraph thread');
      }

      // Research prompt'unu hazırla (kategorilerle birlikte)
      const researchPrompt = this.buildResearchPrompt(validatedRequest, availableCategories);

      // Thread'e mesaj gönder
      console.log(`🔄 LangGraph run oluşturuluyor: ${threadResponse.thread_id}`);
      const messageResponse = await this.sendMessage(threadResponse.thread_id, researchPrompt);
      if (!messageResponse.success || !messageResponse.run_id) {
        console.error('❌ LangGraph run oluşturulamadı:', messageResponse);
        throw new Error('Failed to send message to LangGraph');
      }

      console.log(`✅ LangGraph run oluşturuldu: ${messageResponse.run_id}`);
      
      // Stream response'u bekle ve işle
      console.log(`🔄 LangGraph stream dinleniyor...`);
      const finalResponse = await this.waitForCompletion(threadResponse.thread_id, messageResponse.run_id);
      console.log(`✅ LangGraph stream tamamlandı`);
      
      return {
        success: true,
        thread_id: threadResponse.thread_id,
        ...finalResponse,
      };

    } catch (error) {
      console.error('LangGraph research error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create LangGraph Thread
   * 
   * Yeni bir conversation thread'i oluşturur.
   * 
   * @returns {Promise<{success: boolean, thread_id?: string}>}
   */
  private static async createThread(): Promise<{success: boolean, thread_id?: string}> {
    try {
      console.log(`LangGraph thread oluşturuluyor: ${this.baseUrl}/threads`);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/threads`,
        {
          metadata: {
            source: 'ai-news-platform',
            timestamp: new Date().toISOString(),
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200 && response.data?.thread_id) {
        console.log(`✅ LangGraph thread oluşturuldu: ${response.data.thread_id}`);
        return {
          success: true,
          thread_id: response.data.thread_id,
        };
      }

      console.log(`❌ LangGraph thread oluşturulamadı: Status ${response.status}`);
      throw new Error(`Invalid response: ${response.status}`);
    } catch (error: any) {
      if (error.code === 'ECONNRESET') {
        console.error('❌ LangGraph bağlantısı kesildi (ECONNRESET) - SSH tunnel kontrol et');
      } else if (error.code === 'ECONNABORTED') {
        console.error(`❌ LangGraph timeout (${this.timeout}ms) - Servis çok yavaş veya erişilemiyor`);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ LangGraph servisine bağlanılamıyor - Servis çalışmıyor olabilir');
      } else {
        console.error('❌ LangGraph thread oluşturma hatası:', error.message);
      }
      return { success: false };
    }
  }

  /**
   * Send Message to Thread
   * 
   * Thread'e araştırma mesajı gönderir ve run ID'yi döndürür.
   * 
   * @param threadId - Thread ID
   * @param message - Araştırma prompt'u
   * @returns {Promise<{success: boolean, run_id?: string}>}
   */
  private static async sendMessage(threadId: string, message: string): Promise<{success: boolean, run_id?: string}> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/threads/${threadId}/runs`,
        {
          assistant_id: 'agent', // LangGraph assistant ID
          input: {
            messages: [
              {
                role: 'human',
                content: message,
              }
            ]
          },
          config: {
            configurable: {
              // LangGraph config parametreleri
              max_research_loops: 3,
              number_of_initial_queries: 3,
              reasoning_model: 'gemini-2.0-flash-thinking-exp',
              query_generator_model: 'gemini-2.0-flash-exp',
            }
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200 && response.data?.run_id) {
        return { 
          success: true, 
          run_id: response.data.run_id 
        };
      }

      console.error('❌ LangGraph run response invalid:', response.status, response.data);
      return { success: false };
    } catch (error: any) {
      console.error('❌ LangGraph run oluşturma hatası:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      return { success: false };
    }
  }

  /**
   * Wait for Run Completion
   * 
   * Run'ın tamamlanmasını bekler ve sonucu döndürür.
   * 
   * @param threadId - Thread ID
   * @param runId - Run ID
   * @returns {Promise<Partial<LangGraphResearchResponse>>}
   */
  private static async waitForCompletion(threadId: string, runId: string): Promise<Partial<LangGraphResearchResponse>> {
    // Stream endpoint'ini dinle
    const response: AxiosResponse = await axios.get(
      `${this.baseUrl}/threads/${threadId}/runs/${runId}/stream`,
      {
        timeout: this.timeout,
        headers: {
          'Accept': 'text/event-stream',
        },
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      let finalAnswer = '';
      let sources: any[] = [];
      let confidence = 0.8;
      const startTime = Date.now();

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Final answer'ı yakala
              if (data.type === 'final' && data.content) {
                finalAnswer = data.content;
              }
              
              // Sources'ları yakala
              if (data.sources && Array.isArray(data.sources)) {
                sources = data.sources;
              }
              
              // Confidence score'u yakala
              if (data.confidence_score) {
                confidence = data.confidence_score;
              }
            } catch (parseError) {
              // JSON parse hatası, devam et
              continue;
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve({
          answer: finalAnswer,
          sources: sources,
          confidence_score: confidence,
          processing_time: Math.round((Date.now() - startTime) / 1000),
        });
      });

      response.data.on('error', (error: Error) => {
        reject(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (finalAnswer) {
          resolve({
            answer: finalAnswer,
            sources: sources,
            confidence_score: confidence,
            processing_time: Math.round((Date.now() - startTime) / 1000),
          });
        } else {
          reject(new Error('LangGraph stream timeout'));
        }
      }, this.timeout);
    });
  }

  /**
   * Build Research Prompt
   * 
   * Haber araştırması için optimize edilmiş prompt oluşturur.
   * 
   * @param request - Araştırma isteği
   * @param availableCategories - Mevcut haber kategorileri
   * @returns {string}
   */
  private static buildResearchPrompt(
    request: LangGraphResearchRequest, 
    availableCategories?: Array<{id: string, name: string, slug: string}>
  ): string {
    const language = request.language || 'tr';
    const depth = request.research_depth || 'standard';
    
    const categoriesText = availableCategories 
      ? availableCategories.map(cat => `- ${cat.name} (${cat.slug})`).join('\n')
      : '';
    
    if (language === 'tr') {
      return `
Bu Türkçe haber konusu için kapsamlı araştırma yap ve yeni bir haber makalesi oluştur:

ARAŞTIRMA KONUSU:
${request.query}

${availableCategories ? `MEVCUT KATEGORİLER:
${categoriesText}

Haberin hangi kategoriye ait olduğunu belirle. Eğer hiçbir kategoriye uygun değilse "NONE" yaz.` : ''}

GÖREVLER:
1. Bu konuyla ilgili güncel gelişmeleri araştır
2. Farklı kaynaklardan güvenilir bilgiler topla (minimum ${request.max_results || 5} kaynak)
3. Çoklu bakış açılarını değerlendir
4. Kapsamlı, objektif bir haber makalesi yaz
5. Orijinal haberle karşılaştırma yap

ARAŞTIRMA DERİNLİĞİ: ${depth}

ÇIKTI FORMATI (JSON):
{
  "title": "Yeni, özgün başlık (maksimum 150 karakter)",
  "content": "Kapsamlı haber metni",
  "summary": "Kısa özet (2-3 cümle, maksimum 200 karakter)",
  "category_slug": "uygun-kategori-slug veya NONE",
  "confidence_score": 0.8,
  "sources": [
    {
      "title": "Kaynak başlığı",
      "url": "https://kaynak-url.com",
      "snippet": "Kısa alıntı",
      "reliability_score": 0.9
    }
  ],
  "differences": [
    {
      "title": "Ana fark başlığı",
      "description": "Orijinal haberden farkı açıkla"
    }
  ]
}

ÖNEMLI KURALLAR:
- Sadece JSON formatında yanıt ver, başka metin ekleme
- Türkçe içerik oluştur
- Güncel, doğrulanabilir kaynaklara odaklan
- Orijinal haberden farklı açılar ve detaylar ekle
- Confidence score 0.0-1.0 arası olmalı
- Eğer kategori uygun değilse confidence'ı 0.3'ün altında tut
`;
    } else {
      return `
Conduct comprehensive research on this news topic and create a detailed news article:

RESEARCH TOPIC:
${request.query}

${availableCategories ? `AVAILABLE CATEGORIES:
${categoriesText}

Determine which category this news belongs to. If it doesn't fit any category, write "NONE".` : ''}

TASKS:
1. Research current developments on this topic
2. Gather reliable information from different sources (minimum ${request.max_results || 5} sources)
3. Evaluate multiple perspectives
4. Write a comprehensive, objective news article
5. Compare with original news

RESEARCH DEPTH: ${depth}

OUTPUT FORMAT (JSON):
{
  "title": "New, original headline (max 150 chars)",
  "content": "Comprehensive news content (minimum 500 words)",
  "summary": "Brief summary (2-3 sentences, max 200 chars)",
  "category_slug": "appropriate-category-slug or NONE",
  "confidence_score": 0.8,
  "sources": [
    {
      "title": "Source title",
      "url": "https://source-url.com",
      "snippet": "Brief quote",
      "reliability_score": 0.9
    }
  ],
  "differences": [
    {
      "title": "Main difference title",
      "description": "Explain difference from original news"
    }
  ]
}

IMPORTANT RULES:
- Respond only in JSON format, no additional text
- Focus on current, verifiable sources
- Add different angles and details from original news
- Confidence score must be between 0.0-1.0
- If category doesn't fit, keep confidence below 0.3
`;
    }
  }

  /**
   * Health Check for LangGraph Service
   * 
   * LangGraph servisinin erişilebilir olup olmadığını kontrol eder.
   * 
   * @returns {Promise<boolean>}
   */
  static async healthCheck(): Promise<boolean> {
    const response: AxiosResponse = await axios.get(
      `${this.baseUrl}/health`,
      { timeout: 5000 }
    );
    
    return response.status === 200;
  }
} 