/**
 * RSS Feature Routes
 * 
 * RSS özelliğine ait tüm HTTP endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { RssController } from './rss.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// RSS kaynaklarını listele
router.get('/sources', RssController.getRssSources);

// RSS kaynağını ID ile getir
router.get('/sources/:id', RssController.getRssSourceById);

// ==================== PROTECTED ROUTES ====================

// RSS kaynağı oluştur - admin yetkisi gerektirir
router.post('/sources', authMiddleware, RssController.createRssSource);

// RSS kaynağını güncelle - admin yetkisi gerektirir
router.put('/sources/:id', authMiddleware, RssController.updateRssSource);

// RSS kaynağını sil - admin yetkisi gerektirir
router.delete('/sources/:id', authMiddleware, RssController.deleteRssSource);

// RSS kaynaklarından haber çek - admin yetkisi gerektirir
router.post('/fetch', authMiddleware, RssController.fetchRssFeeds);

// ==================== EXPORT ====================

export const rssRoutes = router; 