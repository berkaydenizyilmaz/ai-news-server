/**
 * Forum Feature Routes
 * 
 * Forum modülü için Express route tanımları.
 * API endpoint'lerini controller'lara yönlendirir.
 */

import { Router } from 'express';
import { authMiddleware } from '@/core/middlewares/auth.middleware';
import { 
  ForumCategoryController,
  ForumTopicController,
  ForumPostController
} from './forum.controller';

const router = Router();

// ==================== FORUM CATEGORIES ROUTES ====================

/**
 * GET /api/forum/categories
 * Get all forum categories
 */
router.get('/categories', ForumCategoryController.getCategories);

/**
 * GET /api/forum/categories/:id
 * Get category by ID
 */
router.get('/categories/:id', ForumCategoryController.getCategoryById);

/**
 * POST /api/forum/categories
 * Create new forum category (Admin only)
 */
router.post('/categories', authMiddleware, ForumCategoryController.createCategory);

// ==================== FORUM TOPICS ROUTES ====================

/**
 * GET /api/forum/topics
 * Get topics with filters and pagination
 * Query params: category_id, page, limit, sort_by, sort_order, search, status, is_pinned
 */
router.get('/topics', ForumTopicController.getTopics);

/**
 * GET /api/forum/topics/:id
 * Get topic by ID with posts
 */
router.get('/topics/:id', ForumTopicController.getTopicById);

/**
 * POST /api/forum/topics
 * Create new forum topic (Authenticated users)
 */
router.post('/topics', authMiddleware, ForumTopicController.createTopic);

/**
 * PUT /api/forum/topics/:id
 * Update forum topic (Owner or Moderator/Admin)
 */
router.put('/topics/:id', authMiddleware, ForumTopicController.updateTopic);

/**
 * DELETE /api/forum/topics/:id
 * Delete forum topic (Owner or Moderator/Admin)
 */
router.delete('/topics/:id', authMiddleware, ForumTopicController.deleteTopic);

// ==================== FORUM POSTS ROUTES ====================

/**
 * GET /api/forum/topics/:topicId/posts
 * Get posts by topic ID with pagination
 * Query params: page, limit
 */
router.get('/topics/:topicId/posts', ForumPostController.getPostsByTopicId);

/**
 * POST /api/forum/posts
 * Create new forum post (Authenticated users)
 */
router.post('/posts', authMiddleware, ForumPostController.createPost);

/**
 * PUT /api/forum/posts/:id
 * Update forum post (Owner or Moderator/Admin)
 */
router.put('/posts/:id', authMiddleware, ForumPostController.updatePost);

/**
 * DELETE /api/forum/posts/:id
 * Delete forum post (Owner or Moderator/Admin)
 */
router.delete('/posts/:id', authMiddleware, ForumPostController.deletePost);

export default router; 