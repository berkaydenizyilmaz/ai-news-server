/**
 * Authentication Feature Routes
 * 
 * Kimlik doğrulama ve yetkilendirme ile ilgili tüm API endpoint'lerini tanımlar.
 * Controller metodlarını ve gerekli middleware'leri route'lara bağlar.
 * 
 */

import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Kullanıcı kaydı
router.post('/register', AuthController.register);

// Kullanıcı girişi
router.post('/login', AuthController.login);

// Kullanıcı çıkışı
router.post('/logout', AuthController.logout);

// ==================== PROTECTED ROUTES ====================

// Kullanıcı profili - kimlik doğrulama gerektirir
router.get('/profile', authMiddleware, AuthController.getProfile);

// Şifre değiştirme - kimlik doğrulama gerektirir
router.put('/change-password', authMiddleware, AuthController.changePassword);

// Token doğrulama - kimlik doğrulama gerektirir
router.get('/verify', authMiddleware, AuthController.verifyToken);

export const authRoutes = router; 