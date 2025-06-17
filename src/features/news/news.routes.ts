/**
 * News Feature Routes
 * 
 * News modülü için API endpoint tanımları.
 * Express Router kullanarak route'ları organize eder.
 */

import { Router } from 'express';
import { NewsController } from './news.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

/**
 * News Router
 * 
 * News modülü için tüm route tanımları.
 */
export const newsRoutes = Router();

// ==================== PROCESSED NEWS ROUTES ====================

/**
 * @route   GET /api/v1/news
 * @desc    Get processed news list with pagination and filters
 * @access  Public
 */
newsRoutes.get('/', NewsController.getProcessedNews);

/**
 * @route   GET /api/v1/news/statistics
 * @desc    Get news statistics
 * @access  Private (Admin)
 */
newsRoutes.get('/statistics', authMiddleware, NewsController.getNewsStatistics);

/**
 * @route   GET /api/v1/news/:id
 * @desc    Get processed news by ID with details
 * @access  Public
 */
newsRoutes.get('/:id', NewsController.getProcessedNewsById);

/**
 * @route   POST /api/v1/news
 * @desc    Create new processed news
 * @access  Private (Admin/Moderator)
 */
newsRoutes.post('/', authMiddleware, NewsController.createProcessedNews);

/**
 * @route   PUT /api/v1/news/:id
 * @desc    Update processed news
 * @access  Private (Admin/Moderator)
 */
newsRoutes.put('/:id', authMiddleware, NewsController.updateProcessedNews);

/**
 * @route   DELETE /api/v1/news/:id
 * @desc    Delete processed news
 * @access  Private (Admin)
 */
newsRoutes.delete('/:id', authMiddleware, NewsController.deleteProcessedNews);

// ==================== NEWS CATEGORIES ROUTES ====================

/**
 * @route   GET /api/v1/news/categories
 * @desc    Get news categories list
 * @access  Public
 */
newsRoutes.get('/categories', NewsController.getNewsCategories);

/**
 * @route   POST /api/v1/news/categories
 * @desc    Create new news category
 * @access  Private (Admin)
 */
newsRoutes.post('/categories', authMiddleware, NewsController.createNewsCategory);

/**
 * @route   PUT /api/v1/news/categories/:id
 * @desc    Update news category
 * @access  Private (Admin)
 */
newsRoutes.put('/categories/:id', authMiddleware, NewsController.updateNewsCategory);

/**
 * @route   DELETE /api/v1/news/categories/:id
 * @desc    Delete news category
 * @access  Private (Admin)
 */
newsRoutes.delete('/categories/:id', authMiddleware, NewsController.deleteNewsCategory);

// ==================== AI NEWS GENERATION ROUTES ====================

/**
 * @route   POST /api/v1/news/generate
 * @desc    Generate news from RSS content using AI
 * @access  Private (Admin/Moderator)
 */
newsRoutes.post('/generate', authMiddleware, NewsController.generateNewsFromRSS);

/**
 * @route   POST /api/v1/news/process-batch
 * @desc    Process multiple RSS news items
 * @access  Private (Admin/Moderator)
 */
newsRoutes.post('/process-batch', authMiddleware, NewsController.processMultipleRSSNews);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @route   POST /api/v1/news/bulk
 * @desc    Bulk operations on news (publish, delete, update category)
 * @access  Private (Admin/Moderator)
 */
newsRoutes.post('/bulk', authMiddleware, NewsController.bulkNewsOperation); 