/**
 * Automation Feature Routes
 * 
 * Otomatikleştirme sistemi için API endpoint tanımları.
 * Sadece admin kullanıcıları erişebilir.
 */

import { Router } from 'express';
import { AutomationController } from './automation.controller';
import { authMiddleware } from '@/core/middlewares/auth.middleware';

/**
 * Automation Router
 * 
 * Otomatikleştirme modülü için tüm route tanımları.
 * Tüm endpoint'ler admin yetkisi gerektirir.
 */
export const automationRoutes = Router();

// Tüm automation endpoint'leri için authentication middleware
automationRoutes.use(authMiddleware);

// ==================== SYSTEM CONTROL ROUTES ====================

/**
 * @route   POST /api/v1/automation/start
 * @desc    Start automation system
 * @access  Private (Admin only)
 */
automationRoutes.post('/start', AutomationController.startAutomation);

/**
 * @route   POST /api/v1/automation/stop
 * @desc    Stop automation system
 * @access  Private (Admin only)
 */
automationRoutes.post('/stop', AutomationController.stopAutomation);

/**
 * @route   POST /api/v1/automation/emergency-stop
 * @desc    Emergency stop automation system
 * @access  Private (Admin only)
 */
automationRoutes.post('/emergency-stop', AutomationController.emergencyStop);

/**
 * @route   GET /api/v1/automation/status
 * @desc    Get automation system status
 * @access  Private (Admin only)
 */
automationRoutes.get('/status', AutomationController.getAutomationStatus);

// ==================== JOB MANAGEMENT ROUTES ====================

/**
 * @route   POST /api/v1/automation/trigger
 * @desc    Trigger manual job
 * @access  Private (Admin only)
 */
automationRoutes.post('/trigger', AutomationController.triggerManualJob);

/**
 * @route   GET /api/v1/automation/queue
 * @desc    Get job queue status
 * @access  Private (Admin only)
 */
automationRoutes.get('/queue', AutomationController.getJobQueueStatus);

// ==================== MONITORING ROUTES ====================

/**
 * @route   GET /api/v1/automation/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
automationRoutes.get('/health', AutomationController.getSystemHealth);

/**
 * @route   GET /api/v1/automation/metrics
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
automationRoutes.get('/metrics', AutomationController.getPerformanceMetrics);

/**
 * @route   GET /api/v1/automation/logs
 * @desc    Get automation logs
 * @access  Private (Admin only)
 */
automationRoutes.get('/logs', AutomationController.getAutomationLogs);

// ==================== CONFIGURATION ROUTES ====================

/**
 * @route   PUT /api/v1/automation/config
 * @desc    Update automation configuration
 * @access  Private (Admin only)
 */
automationRoutes.put('/config', AutomationController.updateConfiguration); 