/**
 * Vector Embedding Utility
 * 
 * Hugging Face API kullanarak metin embedding'leri oluşturur.
 * Duplicate detection için vector similarity hesaplamaları yapar.
 * 
 */

import config from '@/core/config';
import { AI_EMBEDDING_CONFIG } from '@/core/constants';

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
  private static readonly HUGGING_FACE_API_URL = `https://router.huggingface.co/hf-inference/models/${config.huggingFace.model}/pipeline/feature-extraction`;

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
      
      if (!cleanedText || cleanedText.length < AI_EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
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
          'Authorization': `Bearer ${config.huggingFace.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [cleanedText],
          options: {
            wait_for_model: true,
            use_cache: false,
          },
        }),
        signal: AbortSignal.timeout(AI_EMBEDDING_CONFIG.REQUEST_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Hugging Face API hatası: ${response.status} - ${errorText}`,
          processing_time: Date.now() - startTime,
        };
      }

      const apiResponse = await response.json();

      // Feature extraction API yanıtı: [[embedding_vector]] formatında gelir
      let embedding: number[];
      if (Array.isArray(apiResponse) && apiResponse.length > 0 && Array.isArray(apiResponse[0])) {
        embedding = apiResponse[0]; // İlk (ve tek) embedding'i al
      } else if (Array.isArray(apiResponse) && apiResponse.length === AI_EMBEDDING_CONFIG.VECTOR_DIMENSIONS) {
        // Direkt embedding array gelirse
        embedding = apiResponse;
      } else {
        return {
          success: false,
          error: 'Beklenmeyen API yanıt formatı',
          processing_time: Date.now() - startTime,
        };
      }

      // Embedding boyutunu kontrol et
      if (embedding.length !== AI_EMBEDDING_CONFIG.VECTOR_DIMENSIONS) {
        return {
          success: false,
          error: `Geçersiz embedding boyutu: ${embedding.length}`,
          processing_time: Date.now() - startTime,
        };
      }

      return {
        success: true,
        embedding,
        processing_time: Date.now() - startTime,
      };
    } catch (error) {
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
    const threshold = customThreshold || AI_EMBEDDING_CONFIG.SIMILARITY_THRESHOLD;
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
    if (cleaned.length > AI_EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
      // Metni kısalt ama kelime ortasında kesme
      cleaned = cleaned.substring(0, AI_EMBEDDING_CONFIG.MAX_TEXT_LENGTH);
      const lastSpaceIndex = cleaned.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        cleaned = cleaned.substring(0, lastSpaceIndex);
      }
    }

    return cleaned;
  }

  /**
   * Batch Generate Embeddings
   * 
   * Birden fazla metin için toplu embedding oluşturur.
   * 
   * @param texts - Embedding oluşturulacak metinler
   * @param batchSize - Batch boyutu
   * @returns {Promise<EmbeddingResponse[]>} Embedding sonuçları
   */
  static async batchGenerateEmbeddings(
    texts: string[], 
    batchSize: number = AI_EMBEDDING_CONFIG.BATCH_SIZE
  ): Promise<EmbeddingResponse[]> {
    const results: EmbeddingResponse[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get Embedding Dimensions
   * 
   * Embedding vector boyutunu döndürür.
   * 
   * @returns {number} Vector boyutu
   */
  static getEmbeddingDimensions(): number {
    return AI_EMBEDDING_CONFIG.VECTOR_DIMENSIONS;
  }

  /**
   * Get Similarity Threshold
   * 
   * Varsayılan benzerlik eşiğini döndürür.
   * 
   * @returns {number} Benzerlik eşiği
   */
  static getSimilarityThreshold(): number {
    return AI_EMBEDDING_CONFIG.SIMILARITY_THRESHOLD;
  }
} 