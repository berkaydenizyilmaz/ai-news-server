/**
 * RSS Feature Routes
 * 
 * RSS özelliğine ait tüm HTTP endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { RssController } from './rss.controller';
import { authMiddleware, requireAdmin } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// RSS kaynaklarını listele
router.get('/sources', RssController.getRssSources);

// RSS kaynağını ID ile getir
router.get('/sources/:id', RssController.getRssSourceById);

// ==================== PROTECTED ROUTES ====================

// RSS kaynağı oluştur - admin yetkisi gerektirir
router.post('/sources', authMiddleware, requireAdmin, RssController.createRssSource);

// RSS kaynağını güncelle - admin yetkisi gerektirir
router.put('/sources/:id', authMiddleware, requireAdmin, RssController.updateRssSource);

// RSS kaynağını sil - admin yetkisi gerektirir
router.delete('/sources/:id', authMiddleware, requireAdmin, RssController.deleteRssSource);

// RSS kaynaklarından haber çek - admin yetkisi gerektirir
router.post('/fetch', authMiddleware, requireAdmin, RssController.fetchRssFeeds);

// Test endpoints (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/parse', RssController.testRssParsing);
  router.post('/test/scrape', RssController.testWebScraping);
}

// ==================== EXPORT ====================

export const rssRoutes = router; 