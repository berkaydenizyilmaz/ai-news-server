/**
 * Settings Feature Routes
 * 
 * Sistem ayarları yönetimi ile ilgili tüm API endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';
import { adminOnlyMiddleware } from '@/core/middlewares/admin.middleware';

const router = Router();

// ==================== ADMIN ONLY ROUTES ====================

// Tüm settings route'ları admin yetkisi gerektirir
router.use(authMiddleware, adminOnlyMiddleware);

// Ayar oluşturma
router.post('/', SettingsController.createSetting);

// Tüm ayarları getirme (filtreleme desteği ile)
router.get('/', SettingsController.getAllSettings);

// Tek ayar getirme
router.get('/:key', SettingsController.getSettingByKey);

// Ayar güncelleme
router.put('/:key', SettingsController.updateSetting);

// Ayar silme
router.delete('/:key', SettingsController.deleteSetting);

// Toplu ayar güncelleme
router.put('/bulk', SettingsController.bulkUpdateSettings);

// Kategoriye göre ayarları getirme
router.get('/category/:category', SettingsController.getSettingsByCategory);

export const settingsRoutes = router; 