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
  private static timeout = config.aiBackend.timeout;

  /**
   * Research News Topic using LangGraph Agent
   * 
   * Haber konusu için kapsamlı araştırma yapar.
   * 
   * @param request - Araştırma isteği
   * @returns {Promise<LangGraphResearchResponse>}
   */
  static async researchNewsTopic(request: LangGraphResearchRequest): Promise<LangGraphResearchResponse> {
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

      // Research prompt'unu hazırla
      const researchPrompt = this.buildResearchPrompt(validatedRequest);

      // Thread'e mesaj gönder
      const messageResponse = await this.sendMessage(threadResponse.thread_id, researchPrompt);
      if (!messageResponse.success) {
        throw new Error('Failed to send message to LangGraph');
      }

      // Stream response'u bekle ve işle
      const finalResponse = await this.waitForCompletion(threadResponse.thread_id);
      
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
        return {
          success: true,
          thread_id: response.data.thread_id,
        };
      }

      throw new Error(`Invalid response: ${response.status}`);
    } catch (error) {
      console.error('Failed to create LangGraph thread:', error);
      return { success: false };
    }
  }

  /**
   * Send Message to Thread
   * 
   * Thread'e araştırma mesajı gönderir.
   * 
   * @param threadId - Thread ID
   * @param message - Araştırma prompt'u
   * @returns {Promise<{success: boolean}>}
   */
  private static async sendMessage(threadId: string, message: string): Promise<{success: boolean}> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/threads/${threadId}/runs`,
        {
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

      return { success: response.status === 200 };
    } catch (error) {
      console.error('Failed to send message to LangGraph:', error);
      return { success: false };
    }
  }

  /**
   * Wait for Thread Completion
   * 
   * Thread'in tamamlanmasını bekler ve sonucu döndürür.
   * 
   * @param threadId - Thread ID
   * @returns {Promise<Partial<LangGraphResearchResponse>>}
   */
  private static async waitForCompletion(threadId: string): Promise<Partial<LangGraphResearchResponse>> {
    // Stream endpoint'ini dinle
    const response: AxiosResponse = await axios.get(
      `${this.baseUrl}/threads/${threadId}/runs/stream`,
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
   * @returns {string}
   */
  private static buildResearchPrompt(request: LangGraphResearchRequest): string {
    const language = request.language || 'tr';
    const depth = request.research_depth || 'standard';
    
    if (language === 'tr') {
      return `
Bu Türkçe haber konusu için kapsamlı araştırma yap ve yeni bir haber makalesi oluştur:

ARAŞTIRMA KONUSU:
${request.query}

GÖREVLER:
1. Bu konuyla ilgili güncel gelişmeleri araştır
2. Farklı kaynaklardan güvenilir bilgiler topla
3. Çoklu bakış açılarını değerlendir
4. Kapsamlı, objektif bir haber makalesi yaz

ARAŞTIRMA DERİNLİĞİ: ${depth}
MAKSIMUM KAYNAK SAYISI: ${request.max_results || 5}

ÇIKTI GEREKSİNİMLERİ:
- Yeni, özgün başlık
- Kapsamlı haber metni
- Kısa özet (2-3 cümle)
- Kullanılan kaynaklar listesi
- Güvenilirlik analizi

ÖNEMLI: Türkçe yanıt ver ve güncel, doğrulanabilir kaynaklara odaklan.
`;
    } else {
      return `
Conduct comprehensive research on this news topic and create a detailed news article:

RESEARCH TOPIC:
${request.query}

TASKS:
1. Research current developments on this topic
2. Gather reliable information from different sources
3. Evaluate multiple perspectives
4. Write a comprehensive, objective news article

RESEARCH DEPTH: ${depth}
MAX SOURCES: ${request.max_results || 5}

OUTPUT REQUIREMENTS:
- New, original headline
- Comprehensive news content (minimum 500 words)
- Brief summary (2-3 sentences)
- List of sources used
- Reliability analysis

IMPORTANT: Focus on current, verifiable sources.
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