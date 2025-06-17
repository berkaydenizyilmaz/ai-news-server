/**
 * News Feature Types and Interfaces
 * 
 * News modülü için TypeScript tip tanımlamaları.
 * Request/Response DTO'ları ve business logic tipleri.
 */

import { 
  ProcessedNews, 
  NewsCategory, 
  NewsSource, 
  NewsDifference,
  OriginalNews
} from '@/core/types/database.types';

// ==================== REQUEST DTO TYPES ====================

/**
 * News Creation Request DTO
 */
export interface CreateNewsRequest {
  title: string;
  content: string;
  summary?: string;
  image_url?: string;
  category_id?: string;
}

/**
 * News Update Request DTO
 */
export interface UpdateNewsRequest {
  title?: string;
  content?: string;
  summary?: string;
  image_url?: string;
  category_id?: string;
  confidence_score?: number;
  differences_analysis?: string;
}

/**
 * News Query Request DTO
 */
export interface NewsQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'view_count';
  sort_order?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
}

/**
 * Category Creation Request DTO
 */
export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Category Update Request DTO
 */
export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Category Query Request DTO
 */
export interface CategoryQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

// ==================== NEWS GENERATION TYPES ====================

/**
 * News Generation Request DTO
 */
export interface NewsGenerationRequest {
  original_news_id: string;          // RSS'den gelen orijinal haber ID'si
  available_categories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[]; // Mevcut kategoriler (sadece gerekli alanlar)
  max_sources?: number;              // Maksimum kaynak sayısı
  research_depth?: 'basic' | 'deep'; // Araştırma derinliği
  force_regenerate?: boolean;        // Yeniden üretmeyi zorla
}

/**
 * News Generation Result
 */
export interface NewsGenerationResult {
  status: 'success' | 'rejected';
  processed_news?: ProcessedNews;
  sources?: NewsSource[];
  differences?: NewsDifference[];
  rejection_reason?: string;
  processing_time: number;
  confidence_score?: number;
}

/**
 * News Validation Result
 */
export interface NewsValidationResult {
  is_valid: boolean;
  is_suitable: boolean;
  category_match?: Pick<NewsCategory, 'id' | 'name' | 'slug'>;
  rejection_reasons: string[];
  quality_score: number;
  content_analysis: {
    word_count: number;
    sentence_count: number;
    question_count: number;
    has_video_content: boolean;
    has_placeholder_content: boolean;
    language_detected?: string;
  };
}

/**
 * News Processing Result
 */
export interface NewsProcessingResult {
  original_news: OriginalNews;
  validation: NewsValidationResult;
  generation?: NewsGenerationResult;
  error?: string;
}

/**
 * AI Research Context
 */
export interface AIResearchContext {
  original_title: string;
  original_content: string;
  original_url: string;
  available_categories: Pick<NewsCategory, 'id' | 'name' | 'slug'>[];
  research_queries: string[];
  sources_found: AISourceInfo[];
  processing_steps: AIProcessingStep[];
}

/**
 * AI Source Info
 */
export interface AISourceInfo {
  url: string;
  title: string;
  content_snippet: string;
  reliability_score: number;
  publish_date?: string;
  author?: string;
}

/**
 * AI Processing Step
 */
export interface AIProcessingStep {
  step: 'validation' | 'category_matching' | 'research' | 'synthesis' | 'analysis';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  duration?: number;
  data?: any;
}

// ==================== RESPONSE TYPES ====================

/**
 * Generic News Service Response
 */
export interface NewsServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * News List Response
 */
export interface NewsListResponse {
  news: ProcessedNews[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Category List Response
 */
export interface CategoryListResponse {
  categories: NewsCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * News Detail Response
 */
export interface NewsDetailResponse extends ProcessedNews {
  category?: NewsCategory;
  original_news?: OriginalNews;
  sources?: NewsSource[];
  differences?: NewsDifference[];
  related_news?: ProcessedNews[];
}

// ==================== EXTENDED INTERFACES ====================

/**
 * News with Relations
 */
export interface NewsWithRelations extends ProcessedNews {
  category?: NewsCategory;
  original_news?: OriginalNews;
  sources?: NewsSource[];
  differences?: NewsDifference[];
}

/**
 * Category with Stats
 */
export interface CategoryWithStats extends NewsCategory {
  news_count?: number;
  latest_news_date?: string;
}

/**
 * News Statistics
 */
export interface NewsStatistics {
  total_news: number;
  published_news: number;
  pending_news: number;
  processing_news: number;
  rejected_news: number;
  categories_count: number;
  avg_confidence_score: number;
  total_sources: number;
  processing_time_avg: number;
}

// ==================== SEARCH & FILTER TYPES ====================

/**
 * News Search Filters
 */
export interface NewsSearchFilters {
  query?: string;
  categories?: string[];
  confidence_min?: number;
  confidence_max?: number;
  date_range?: {
    start: string;
    end: string;
  };
  has_sources?: boolean;
  has_differences?: boolean;
}

/**
 * News Sort Options
 */
export interface NewsSortOptions {
  field: 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'confidence_score';
  direction: 'asc' | 'desc';
}

// ==================== BULK OPERATIONS ====================

/**
 * Bulk News Operation Request
 */
export interface BulkNewsOperationRequest {
  news_ids: string[];
  operation: 'delete' | 'update_category';
  data?: {
    category_id?: string;
  };
}

/**
 * Bulk News Operation Result
 */
export interface BulkNewsOperationResult {
  success_count: number;
  failed_count: number;
  total_count: number;
  failed_items: {
    id: string;
    error: string;
  }[];
} 