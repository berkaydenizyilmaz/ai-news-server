/**
 * Comments Feature Entry Point
 * 
 * Comments modülünün ana export dosyası.
 * Diğer modüller tarafından kullanılabilecek bileşenleri dışa aktarır.
 */

// Router'ı dışa aktar (ana uygulama tarafından kullanılacak)
export { default as commentsRouter } from './comments.routes';

// Service'i dışa aktar (diğer modüller tarafından kullanılabilir)
export { CommentsService } from './comments.service';

// Model'i dışa aktar (gerekirse diğer modüller tarafından kullanılabilir)
export { CommentsModel } from './comments.model';

// Type'ları dışa aktar (diğer modüller tarafından kullanılabilir)
export type {
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentQueryRequest,
  BulkModerationRequest,
  CommentStatistics,
  BulkModerationResult,
  ModerationItemResult,
  CommentServiceResponse,
  CommentWithPermissions,
  CommentTreeNode,
  CommentValidationError,
  CommentFilterOptions,
} from './comments.types';

// Validation type'larını dışa aktar
export type {
  CreateCommentInput,
  UpdateCommentInput,
  CommentIdInput,
  CommentQueryInput,
  BulkModerationInput,
} from './comments.validation';

// Sabitler dışa aktar (gerekirse diğer modüller tarafından kullanılabilir)
export {
  COMMENT_QUERY_CONSTRAINTS,
  COMMENT_CONTENT_CONSTRAINTS,
  COMMENT_MODERATION_CONSTRAINTS,
  COMMENT_ERROR_MESSAGES,
  COMMENT_SUCCESS_MESSAGES,
  COMMENT_PERMISSIONS,
  COMMENT_SORT_OPTIONS,
  COMMENT_STATUS,
  COMMENT_MODERATION_ACTIONS,
} from './comments.constants'; 