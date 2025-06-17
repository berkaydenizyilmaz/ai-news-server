/**
 * News Feature Module Exports
 * 
 * News modülünün tüm public API'lerini dışa aktarır.
 * Diğer modüller bu dosya üzerinden news işlemlerine erişir.
 */

// Routes
export { newsRoutes } from './news.routes';

// Types
export type {
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsQueryRequest,
  NewsGenerationRequest,
  NewsServiceResponse,
  NewsGenerationResult,
  NewsValidationResult,
  NewsProcessingResult,
} from './news.types';

// Constants
export {
  NEWS_ERROR_MESSAGES,
  NEWS_SUCCESS_MESSAGES,
  NEWS_QUERY_CONSTRAINTS,
  NEWS_GENERATION_CONFIG,
  NEWS_VALIDATION_RULES,
} from './news.constants';

// Service (for internal use)
export { NewsService } from './news.service'; 