/**
 * Log Feature Routes
 * 
 * Log yönetimi ile ilgili tüm API endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { LogController } from './log.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Log oluşturma - kimlik doğrulama opsiyonel (anonim loglar için)
router.post('/', LogController.createLog);

// ==================== PROTECTED ROUTES ====================

// Log listesi - kimlik doğrulama gerektirir
router.get('/', authMiddleware, LogController.getLogs);

// Log istatistikleri - admin yetkisi gerektirir (controller'da kontrol edilir)
router.get('/stats', authMiddleware, LogController.getLogStats);

// Kullanıcı logları - kimlik doğrulama gerektirir
router.get('/user/:userId', authMiddleware, LogController.getUserLogs);

// Eski log temizleme - admin yetkisi gerektirir (controller'da kontrol edilir)
router.delete('/cleanup', authMiddleware, LogController.cleanOldLogs);

// Tek log kaydı - kimlik doğrulama gerektirir (en sonda olmalı)
router.get('/:id', authMiddleware, LogController.getLogById);

export const logRoutes = router; 