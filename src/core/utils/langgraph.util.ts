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
  query: z.string().min(10, 'Araştırma sorgusu en az 10 karakter olmalıdır').max(5000, 'Araştırma sorgusu çok uzun'),
  max_results: z.number().int().min(1).max(20).optional().default(5),
  research_depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard'),
});

// ==================== TYPE DEFINITIONS ====================

export interface LangGraphResearchRequest {
  query: string;
  max_results?: number;
  research_depth?: 'quick' | 'standard' | 'deep';
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
  private static timeout = 180000; // 3 dakika - LangGraph araştırması uzun sürebilir

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
          assistant_id: 'agent',
          input: {
            messages: [
              {
                type: 'human',
                content: message,
                id: Date.now().toString(),
              }
            ],
            initial_search_query_count: 3,
            max_research_loops: 2,
            reasoning_model: 'gemini-2.5-flash-preview-04-17'
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

      let buffer = '';
      
      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        
        // Complete lines'ları işle
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Son incomplete line'ı buffer'da tut
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                console.log('🏁 LangGraph stream finished');
                continue;
              }
              
              if (jsonStr === '') continue; // Empty data lines
              
              const data = JSON.parse(jsonStr);
              
              // Error event'i kontrol et
              if (data.error) {
                console.error('❌ LangGraph stream error:', data.error, data.message);
                reject(new Error(`LangGraph error: ${data.error} - ${data.message}`));
                return;
              }
              
              // Messages array'inde AI response'unu ara
              if (data.messages && Array.isArray(data.messages)) {
                for (const message of data.messages) {
                  if (message.type === 'ai' && message.content) {
                    console.log('🤖 AI message yakalandı');
                    
                    // JSON formatında haber makalesi arayalım
                    const content = message.content;
                    const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                    
                    if (jsonMatch) {
                      try {
                        const newsData = JSON.parse(jsonMatch[1]);
                        console.log('✅ Haber JSON\'u parse edildi:', newsData.title?.substring(0, 50));
                        finalAnswer = JSON.stringify(newsData);
                        
                        // Kaynak ve confidence bilgilerini al
                        if (newsData.sources) sources = newsData.sources;
                        if (newsData.confidence_score) confidence = newsData.confidence_score;
                      } catch (jsonError) {
                        console.log('⚠️ Haber JSON parse hatası, raw content kullanılıyor');
                        finalAnswer = content;
                      }
                    } else {
                      finalAnswer = content;
                    }
                  }
                }
              }
              
            } catch (parseError) {
              // Parse edilemeyen chunk'ları logla ama devam et
              const preview = line.length > 100 ? line.substring(0, 100) + '...' : line;
              console.log('⚠️ JSON parse hatası:', preview);
              continue;
            }
          } else if (line.trim() === ': heartbeat') {
            console.log('💓 Heartbeat');
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
    const depth = request.research_depth || 'standard';
    
    const categoriesText = availableCategories 
      ? availableCategories.map(cat => `- ${cat.name} (${cat.slug})`).join('\n')
      : '';
    
    return `
Bu Türkçe haber konusu için kapsamlı araştırma yaparak yeni bir haber makalesi oluştur:

ARAŞTIRMA KONUSU:
${request.query}

${availableCategories ? `MEVCUT KATEGORİLER:
${categoriesText}

Haberin hangi kategoriye ait olduğunu belirle. Eğer hiçbir kategoriye uygun değilse "genel" yaz.` : ''}

GÖREVLER:
1. Bu konuyla ilgili güncel gelişmeleri araştır
2. Farklı kaynaklardan güvenilir bilgiler topla (maksimum ${request.max_results || 5} kaynak kullan)
3. Kapsamlı, objektif bir haber makalesi yaz
4. Kaynaklar arasında çelişki varsa source_conflicts alanında belirt
5. Reliability score'u belirle (0-1 arası)

ARAŞTIRMA DERİNLİĞİ: ${depth}

METIN FORMATLAMA KURALLARI:
- Her paragraf arasında \\n\\n (çift satır geçişi) kullan
- Uzun metinleri anlamlı paragraflara böl
- Her paragraf 3-5 cümle olsun
- Giriş, gelişme, sonuç paragrafları oluştur
- Liste halinde bilgiler varsa \\n ile ayır

ÇIKTI FORMATI - SADECE BU JSON'U DÖNDÜR:
{
  "is_suitable": true,
  "rejection_reason": null,
  "title": "Haber başlığı",
  "content": "Tam haber metni - paragraflar arası \\n\\n ile ayrılmış",
  "summary": "Kısa özet",
  "category_slug": "kategori-slug",
  "confidence_score": 0.9,
  "source_conflicts": "",
  "sources": [
    {
      "name": "Kaynak adı",
      "url": "https://example.com",
      "snippet": "Kısa alıntı",
      "reliability_score": 0.9
    }
  ]
}

MUTLAKA UYULACAK KURALLAR:
1. SADECE JSON döndür, başka hiçbir metin yazma
2. Tüm string değerleri çift tırnak içinde yaz
3. Son property'den sonra virgül KOYMA
4. Boolean: true/false (tırnak olmadan)
5. Null: null (tırnak olmadan)
6. Sayı: 0.9 (tırnak olmadan)
7. Array'de son elemandan sonra virgül KOYMA
8. Özel karakterleri escape et: \" \n \\
9. Content'te paragraf geçişleri için \\n\\n kullan
10. Türkçe karakter sorun yaratmasın
11. Content içinde [kaynak](link) formatı KESINLIKLE YASAK
12. Content içinde [isim, tarih] formatı KESINLIKLE YASAK
13. Content sadece düz metin olacak, hiçbir referans içermeyecek
14. Tüm kaynak bilgilerini sadece sources array'inde ver ve sadece 5 kaynak seç ve kullan
15. Content'te kaynak belirtme, sadece haber metnini yaz
16. Paragrafları \\n\\n ile ayır, tek \\n sadece liste öğeleri için kullan
`;
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