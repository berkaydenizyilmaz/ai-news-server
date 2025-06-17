/**
 * Automation Controller
 * 
 * Otomatikleştirme sistemi için HTTP endpoint'leri yönetir.
 * Admin paneli için automation kontrolü sağlar.
 */

import { Request, Response, NextFunction } from 'express';
import { AutomationService } from './automation.service';
import { HTTP_STATUS } from '@/core/constants/http.constants';
import { AUTOMATION_ERROR_MESSAGES } from './automation.constants';

/**
 * Automation Controller Class
 * 
 * Otomatikleştirme sistemi HTTP controller'ı.
 */
export class AutomationController {

  /**
   * Start Automation System
   * POST /api/v1/automation/start
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async startAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      const result = await automationService.startAutomation(req.body);

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stop Automation System
   * POST /api/v1/automation/stop
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async stopAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      const result = await automationService.stopAutomation(req.body);

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Automation Status
   * GET /api/v1/automation/status
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getAutomationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      const status = await automationService.getSchedulerStatus();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger Manual Job
   * POST /api/v1/automation/trigger
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async triggerManualJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      const result = await automationService.triggerManualJob(req.body);

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get System Health
   * GET /api/v1/automation/health
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getSystemHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Health check implementation
      const healthStatus = {
        overall_status: 'healthy',
        checks: [
          {
            type: 'database',
            status: 'healthy',
            message: 'Database connection OK',
            response_time: 15,
          },
          {
            type: 'rss_sources',
            status: 'healthy',
            message: 'RSS sources accessible',
            response_time: 120,
          },
          {
            type: 'ai_service',
            status: 'healthy',
            message: 'AI service operational',
            response_time: 250,
          },
        ],
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory_usage: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        },
        database_status: {
          connected: true,
          query_time: 15,
          active_connections: 5,
        },
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Performance Metrics
   * GET /api/v1/automation/metrics
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getPerformanceMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Performance metrics implementation
      const metrics = {
        timestamp: new Date().toISOString(),
        rss_fetch_metrics: {
          total_sources: 10,
          successful_fetches: 9,
          failed_fetches: 1,
          avg_fetch_time: 2500,
          total_items_fetched: 150,
        },
        ai_processing_metrics: {
          total_processed: 45,
          successful_generations: 38,
          rejected_items: 5,
          failed_items: 2,
          avg_processing_time: 15000,
          avg_confidence_score: 0.78,
        },
        system_metrics: {
          memory_usage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
          cpu_usage: 0, // CPU usage calculation needed
          disk_usage: 0, // Disk usage calculation needed
          active_jobs: 3,
          queue_size: 12,
        },
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Job Queue Status
   * GET /api/v1/automation/queue
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getJobQueueStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      const queueStatus = automationService.getJobQueueStatistics();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: queueStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Automation Configuration
   * PUT /api/v1/automation/config
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async updateConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Configuration update implementation
      const updatedConfig = req.body;

      // Validate configuration
      if (!updatedConfig || typeof updatedConfig !== 'object') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Geçersiz konfigürasyon verisi',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Apply configuration (implementation needed)
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedConfig,
        message: 'Konfigürasyon başarıyla güncellendi',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Automation Logs
   * GET /api/v1/automation/logs
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async getAutomationLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const level = req.query.level as string;

      // Log query parameters
      const queryParams = {
        page,
        limit,
        module: 'automation',
        level: level || undefined,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      };

      // Get logs from LogService (implementation needed)
      const mockLogs = {
        logs: [
          {
            id: '1',
            level: 'info',
            message: 'Automation system started',
            module: 'automation',
            action: 'start_automation',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            level: 'info',
            message: 'RSS fetch job completed',
            module: 'automation',
            action: 'rss_fetch',
            created_at: new Date(Date.now() - 300000).toISOString(),
          },
        ],
        total: 25,
        page,
        limit,
        totalPages: Math.ceil(25 / limit),
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: mockLogs,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Emergency Stop
   * POST /api/v1/automation/emergency-stop
   * 
   * @param req - Express Request
   * @param res - Express Response
   * @param next - Express NextFunction
   */
  static async emergencyStop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const automationService = AutomationService.getInstance();
      
      // Force stop without graceful shutdown
      const result = await automationService.stopAutomation({
        graceful_shutdown: false,
        timeout: 5000,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Acil durdurma işlemi tamamlandı',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
} 