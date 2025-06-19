/**
 * Forum Feature Module Exports
 * 
 * Forum modülünün tüm bileşenlerini dışa aktarır.
 * Diğer modüller tarafından kullanılabilir.
 */

// Routes
export { default as forumRouter } from './forum.routes';

// Controllers
export {
  ForumCategoryController,
  ForumTopicController,
  ForumPostController
} from './forum.controller';

// Services
export {
  ForumCategoryService,
  ForumTopicService,
  ForumPostService
} from './forum.service';

// Models
export {
  ForumCategoryModel,
  ForumTopicModel,
  ForumPostModel
} from './forum.model';

// Types
export * from './forum.types';

// Validation Schemas
export * from './forum.validation';

// Constants
export * from './forum.constants'; 