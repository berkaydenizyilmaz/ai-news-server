/**
 * Users Feature Routes
 * 
 * Kullanıcı yönetimi ile ilgili tüm API endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PROTECTED ROUTES (Admin Only) ====================

// Kullanıcı istatistikleri - admin yetkisi gerektirir
router.get('/statistics', authMiddleware, UsersController.getUsersStatistics);

// Kullanıcı listesi - admin yetkisi gerektirir
router.get('/', authMiddleware, UsersController.getUsers);

// Kullanıcı detayı - admin yetkisi gerektirir
router.get('/:id', authMiddleware, UsersController.getUserById);

// Kullanıcı güncelleme - admin yetkisi gerektirir
router.put('/:id', authMiddleware, UsersController.updateUser);

// Kullanıcı rolü güncelleme - admin yetkisi gerektirir
router.put('/:id/role', authMiddleware, UsersController.updateUserRole);

// Kullanıcı durumu güncelleme - admin yetkisi gerektirir
router.put('/:id/status', authMiddleware, UsersController.updateUserStatus);

// Kullanıcı silme (soft delete) - admin yetkisi gerektirir
router.delete('/:id', authMiddleware, UsersController.deleteUser);

export const usersRoutes = router; 