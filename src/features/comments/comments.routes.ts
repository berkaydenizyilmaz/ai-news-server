/**
 * Comments Feature Routes
 * 
 * Comments modülü için HTTP route tanımları.
 * Express Router kullanarak endpoint'leri organize eder.
 * 
 */

import { Router } from 'express';
import { CommentsController } from './comments.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

/**
 * Comments Router
 * 
 * Tüm comment endpoint'lerini tanımlar.
 */
const router = Router();

// ==================== COMMENT CRUD ROUTES ====================

/**
 * POST /api/comments
 * Yeni yorum oluştur
 * Kullanıcı girişi gereklidir
 */
router.post('/', authMiddleware, CommentsController.createComment);

/**
 * GET /api/comments/news/:newsId
 * Belirli bir haberin yorumlarını getir
 * Genel erişim (login opsiyonel)
 */
router.get('/news/:newsId', CommentsController.getCommentsForNews);

/**
 * GET /api/comments/:id
 * ID'ye göre yorum getir
 * Genel erişim (login opsiyonel)
 */
router.get('/:id', CommentsController.getCommentById);

/**
 * PUT /api/comments/:id
 * Yorumu güncelle
 * Kullanıcı girişi gereklidir
 */
router.put('/:id', authMiddleware, CommentsController.updateComment);

/**
 * DELETE /api/comments/:id
 * Yorumu sil (soft delete)
 * Kullanıcı girişi gereklidir
 */
router.delete('/:id', authMiddleware, CommentsController.deleteComment);

// ==================== MODERATION ROUTES ====================

/**
 * POST /api/comments/moderate
 * Toplu moderasyon işlemi
 * Moderatör/admin yetkisi gereklidir
 */
router.post('/moderate', authMiddleware, CommentsController.bulkModeration);

// ==================== STATISTICS ROUTES ====================

/**
 * GET /api/comments/statistics
 * Yorum istatistikleri
 * Moderatör/admin yetkisi gereklidir
 */
router.get('/statistics', authMiddleware, CommentsController.getCommentStatistics);

export default router; 