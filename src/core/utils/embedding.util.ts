/**
 * Vector Embedding Utility
 * 
 * Hugging Face API kullanarak metin embedding'leri oluşturur.
 * Duplicate detection için vector similarity hesaplamaları yapar.
 * 
 */

/**
 * Embedding Response Interface
 * 
 * Hugging Face API'den dönen embedding yanıtı.
 */
interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  error?: string;
  processing_time?: number;
}

/**
 * Similarity Result Interface
 * 
 * Vector similarity hesaplama sonucu.
 */
interface SimilarityResult {
  similarity: number;
  is_duplicate: boolean;
  threshold_used: number;
}

/**
 * Vector Embedding Class
 * 
 * Static metodlarla embedding işlemlerini yönetir.
 */
export class EmbeddingUtil {
  private static readonly HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
  private static readonly SIMILARITY_THRESHOLD = 0.85; // %85 benzerlik eşiği
  private static readonly MAX_TEXT_LENGTH = 512; // Model limiti
  private static readonly REQUEST_TIMEOUT = 30000; // 30 saniye

  /**
   * Generate Text Embedding
   * 
   * Verilen metin için 384 boyutlu vector embedding oluşturur.
   * 
   * @param text - Embedding oluşturulacak metin
   * @returns {Promise<EmbeddingResponse>} Embedding sonucu
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    
    try {
      // Metni temizle ve kısalt
      const cleanedText = this.preprocessText(text);
      
      if (!cleanedText || cleanedText.length < 10) {
        return {
          success: false,
          error: 'Metin çok kısa veya geçersiz',
          processing_time: Date.now() - startTime,
        };
      }

      // Hugging Face API'ye istek gönder
      const response = await fetch(this.HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: cleanedText,
          options: {
            wait_for_model: true,
          },
        }),
        signal: AbortSignal.timeout(this.REQUEST_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Hugging Face API hatası: ${response.status} - ${errorText}`,
          processing_time: Date.now() - startTime,
        };
      }

      const embedding = await response.json();

      // API yanıtını kontrol et
      if (!Array.isArray(embedding) || embedding.length !== 384) {
        return {
          success: false,
          error: 'Geçersiz embedding formatı',
          processing_time: Date.now() - startTime,
        };
      }

      return {
        success: true,
        embedding,
        processing_time: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Embedding generation error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen embedding hatası',
        processing_time: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate Cosine Similarity
   * 
   * İki vector arasındaki cosine similarity hesaplar.
   * 
   * @param vector1 - İlk vector
   * @param vector2 - İkinci vector
   * @returns {number} Similarity skoru (0-1 arası)
   */
  static calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vector boyutları eşleşmiyor');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Check Similarity
   * 
   * İki vector arasındaki benzerliği kontrol eder ve duplicate olup olmadığını belirler.
   * 
   * @param vector1 - İlk vector
   * @param vector2 - İkinci vector
   * @param customThreshold - Özel eşik değeri (opsiyonel)
   * @returns {SimilarityResult} Benzerlik sonucu
   */
  static checkSimilarity(
    vector1: number[], 
    vector2: number[], 
    customThreshold?: number
  ): SimilarityResult {
    const threshold = customThreshold || this.SIMILARITY_THRESHOLD;
    const similarity = this.calculateCosineSimilarity(vector1, vector2);
    
    return {
      similarity,
      is_duplicate: similarity >= threshold,
      threshold_used: threshold,
    };
  }

  /**
   * Preprocess Text
   * 
   * Metni embedding için hazırlar.
   * 
   * @param text - İşlenecek metin
   * @returns {string} İşlenmiş metin
   * @private
   */
  private static preprocessText(text: string): string {
    if (!text) return '';

    // Metni temizle
    let cleaned = text
      .replace(/\s+/g, ' ')           // Çoklu boşlukları tek boşluğa çevir
      .replace(/[^\w\s\u00C0-\u017F]/g, ' ') // Özel karakterleri kaldır (Türkçe karakterler hariç)
      .trim();

    // Uzunluk kontrolü
    if (cleaned.length > this.MAX_TEXT_LENGTH) {
      // Metni kısalt ama kelime ortasında kesme
      cleaned = cleaned.substring(0, this.MAX_TEXT_LENGTH);
      const lastSpaceIndex = cleaned.lastIndexOf(' ');
      if (lastSpaceIndex > this.MAX_TEXT_LENGTH * 0.8) {
        cleaned = cleaned.substring(0, lastSpaceIndex);
      }
    }

    return cleaned;
  }

  /**
   * Batch Generate Embeddings
   * 
   * Birden fazla metin için embedding oluşturur.
   * 
   * @param texts - Embedding oluşturulacak metinler
   * @param batchSize - Batch boyutu
   * @returns {Promise<EmbeddingResponse[]>} Embedding sonuçları
   */
  static async batchGenerateEmbeddings(
    texts: string[], 
    batchSize: number = 5
  ): Promise<EmbeddingResponse[]> {
    const results: EmbeddingResponse[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Rate limiting için kısa bekleme
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Batch embedding error:', error);
        
        // Hatalı batch için boş sonuçlar ekle
        const errorResults = batch.map(() => ({
          success: false,
          error: 'Batch işlemi başarısız',
        }));
        results.push(...errorResults);
      }
    }
    
    return results;
  }

  /**
   * Get Embedding Dimensions
   * 
   * Kullanılan modelin embedding boyutunu döndürür.
   * 
   * @returns {number} Embedding boyutu
   */
  static getEmbeddingDimensions(): number {
    return 384; // all-MiniLM-L6-v2 model boyutu
  }

  /**
   * Get Similarity Threshold
   * 
   * Varsayılan similarity threshold'unu döndürür.
   * 
   * @returns {number} Similarity threshold
   */
  static getSimilarityThreshold(): number {
    return this.SIMILARITY_THRESHOLD;
  }
} 