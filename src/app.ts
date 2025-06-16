/**
 * Main Express Application Module
 * 
 * Express uygulamasının ana yapılandırma ve başlatma modülü.
 * Global middleware'ler, route'lar ve hata yönetimini içerir.
 * 
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from '@/core/config';
import { errorHandler } from '@/core/middlewares/errorHandler.middleware';
import { authRoutes } from '@/features/auth';
import { settingsRoutes } from '@/features/settings';
import { rssRoutes } from '@/features/rss';
import { logRoutes } from '@/features/logs';
import { usersRoutes } from '@/features/users';

const app = express();

// ==================== GLOBAL MIDDLEWARES ====================

// Güvenlik başlıkları ve önlemleri
app.use(helmet());

// Cross-Origin Resource Sharing ayarları
app.use(cors());

// Request body parser ayarları
app.use(express.json({ limit: '10mb' })); // JSON istekleri için
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Form verileri için

// Development ortamında HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ==================== SYSTEM ENDPOINTS ====================

/**
 * Health Check Endpoint
 * 
 * Sistemin çalışır durumda olduğunu kontrol etmek için basit endpoint.
 * Monitoring ve deployment kontrolleri için kullanılır.
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

/**
 * API Info Endpoint
 * 
 * API versiyonu ve genel bilgileri döndürür.
 */
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI News API v1.0',
    version: '1.0.0',
  });
});

// ==================== FEATURE ROUTES ====================

// Authentication routes
app.use('/api/auth', authRoutes);

// Users routes
app.use('/api/users', usersRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// RSS routes
app.use('/api/rss', rssRoutes);

// Log routes
app.use('/api/logs', logRoutes);

// ==================== ERROR HANDLING ====================

/**
 * 404 Handler
 * 
 * Tanımlı olmayan route'lar için 404 yanıtı döndürür.
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler - tüm hataları yakalar
app.use(errorHandler);

export default app; 