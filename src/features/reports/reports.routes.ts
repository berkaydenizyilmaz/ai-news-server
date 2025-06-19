/**
 * Reports Feature Routes
 * 
 * Reports özelliğine ait tüm HTTP endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware, requireModerator, requireAdmin } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PROTECTED ROUTES ====================

// Şikayet oluştur - kullanıcı yetkisi gerektirir
router.post('/', authMiddleware, ReportsController.createReport);

// Şikayetleri listele - moderatör/admin yetkisi gerektirir
router.get('/', authMiddleware, requireModerator, ReportsController.getReports);

// Şikayet istatistikleri - moderatör/admin yetkisi gerektirir
router.get('/statistics', authMiddleware, requireModerator, ReportsController.getReportStatistics);

// Toplu şikayet işlemi - moderatör/admin yetkisi gerektirir
router.post('/bulk-action', authMiddleware, requireModerator, ReportsController.bulkReportAction);

// Şikayeti ID ile getir - moderatör/admin yetkisi gerektirir
router.get('/:id', authMiddleware, requireModerator, ReportsController.getReportById);

// Şikayeti değerlendir - moderatör/admin yetkisi gerektirir
router.put('/:id/review', authMiddleware, requireModerator, ReportsController.reviewReport);

// Şikayeti sil - admin yetkisi gerektirir
router.delete('/:id', authMiddleware, requireAdmin, ReportsController.deleteReport);

// ==================== EXPORT ====================

export const reportsRoutes = router; 