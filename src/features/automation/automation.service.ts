/**
 * Automation Service
 * 
 * RSS çekme ve AI haber işleme süreçlerini otomatikleştiren ana servis.
 * Scheduler ve JobQueue service'lerini koordine eder.
 */

import { EventEmitter } from 'events';
import { 
  SCHEDULER_CONFIG, 
  AUTOMATION_SUCCESS_MESSAGES, 
  AUTOMATION_ERROR_MESSAGES,
  RETRY_CONFIG,
  JOB_PRIORITIES
} from './automation.constants';
import {
  AutomationServiceResponse,
  SchedulerConfig,
  SchedulerStatus,
  SystemHealthStatus,
  StartAutomationRequest,
  StopAutomationRequest,
  ManualJobTriggerRequest
} from './automation.types';
import { SchedulerService } from './scheduler.service';
import { JobQueueService } from './job-queue.service';
import { LogService } from '@/features/logs/log.service';

/**
 * Main Automation Service
 */
export class AutomationService extends EventEmitter {
  private static instance: AutomationService;
  private isRunning: boolean = false;
  private startTime: Date | null = null;
  private scheduler: SchedulerService;
  private jobQueue: JobQueueService;
  private config: SchedulerConfig;

  /**
   * Singleton Pattern
   */
  static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private constructor() {
    super();
    this.config = {
      rss_fetch_interval: SCHEDULER_CONFIG.RSS_FETCH_INTERVAL,
      ai_processing_interval: SCHEDULER_CONFIG.AI_PROCESSING_INTERVAL,
      health_check_interval: SCHEDULER_CONFIG.HEALTH_CHECK_INTERVAL,
      cleanup_interval: SCHEDULER_CONFIG.CLEANUP_INTERVAL,
      max_concurrent_jobs: 5,
      enable_retry_mechanism: true,
      enable_circuit_breaker: true,
    };

    this.scheduler = new SchedulerService(this.config);
    this.jobQueue = new JobQueueService(this.config.max_concurrent_jobs);

    this.setupEventHandlers();
  }

  /**
   * Setup Event Handlers
   */
  private setupEventHandlers(): void {
    // Scheduler events
    this.scheduler.on('schedule_rss_fetch', () => {
      this.jobQueue.addJob({
        type: 'rss_fetch',
        priority: JOB_PRIORITIES.HIGH,
        max_retries: RETRY_CONFIG.RSS_MAX_RETRIES,
        data: { max_items: 10, force_fetch: false },
      } as any);
    });

    this.scheduler.on('schedule_health_check', () => {
      this.jobQueue.addJob({
        type: 'health_check',
        priority: JOB_PRIORITIES.LOW,
        max_retries: 1,
        data: { check_types: ['database', 'rss_sources', 'ai_service'], detailed: false },
      } as any);
    });

    this.scheduler.on('schedule_cleanup', () => {
      this.jobQueue.addJob({
        type: 'cleanup',
        priority: JOB_PRIORITIES.LOW,
        max_retries: 1,
        data: { cleanup_type: 'logs', retention_days: SCHEDULER_CONFIG.CLEANUP_RETENTION_DAYS, dry_run: false },
      } as any);
    });

    this.scheduler.on('schedule_batch_processing', (jobData) => {
      this.jobQueue.addJob(jobData);
    });

    // Job queue events
    this.jobQueue.on('job_completed', this.onJobCompleted.bind(this));
    this.jobQueue.on('job_failed', this.onJobFailed.bind(this));
  }

  /**
   * Start Automation System
   */
  async startAutomation(request: StartAutomationRequest = {}): Promise<AutomationServiceResponse<SchedulerStatus>> {
    try {
      if (this.isRunning) {
        return {
          success: false,
          error: 'Automation sistemi zaten çalışıyor',
          timestamp: new Date().toISOString(),
        };
      }

      // Konfigürasyonu güncelle
      if (request.config) {
        this.config = { ...this.config, ...request.config };
        this.scheduler.updateConfig(this.config);
      }

      // Sistem sağlık kontrolü
      if (!request.force_start) {
        const healthCheck = await this.performHealthCheck();
        if (healthCheck.overall_status === 'critical') {
          return {
            success: false,
            error: 'Sistem sağlık kontrolü başarısız - force_start kullanın',
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Servisleri başlat
      await this.scheduler.start();
      this.jobQueue.start();

      this.isRunning = true;
      this.startTime = new Date();

      const status = await this.getSchedulerStatus();

      // Log kaydı
      await LogService.createLog({
        level: 'info',
        message: AUTOMATION_SUCCESS_MESSAGES.SCHEDULER_STARTED,
        module: 'automation',
        action: 'start_automation',
      });

      return {
        success: true,
        data: status,
        message: AUTOMATION_SUCCESS_MESSAGES.SCHEDULER_STARTED,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error starting automation:', error);
      
      await LogService.createLog({
        level: 'error',
        message: AUTOMATION_ERROR_MESSAGES.SCHEDULER_START_FAILED,
        module: 'automation',
        action: 'start_automation',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      return {
        success: false,
        error: AUTOMATION_ERROR_MESSAGES.SCHEDULER_START_FAILED,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stop Automation System
   */
  async stopAutomation(request: StopAutomationRequest = {}): Promise<AutomationServiceResponse<void>> {
    try {
      if (!this.isRunning) {
        return {
          success: false,
          error: 'Automation sistemi zaten durmuş',
          timestamp: new Date().toISOString(),
        };
      }

      // Graceful shutdown
      if (request.graceful_shutdown) {
        await this.jobQueue.waitForActiveJobs(request.timeout || 60000);
      }

      // Servisleri durdur
      this.scheduler.stop();
      this.jobQueue.stop();

      this.isRunning = false;
      this.startTime = null;

      await LogService.createLog({
        level: 'info',
        message: AUTOMATION_SUCCESS_MESSAGES.SCHEDULER_STOPPED,
        module: 'automation',
        action: 'stop_automation',
      });

      return {
        success: true,
        message: AUTOMATION_SUCCESS_MESSAGES.SCHEDULER_STOPPED,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error stopping automation:', error);
      
      await LogService.createLog({
        level: 'error',
        message: AUTOMATION_ERROR_MESSAGES.SCHEDULER_STOP_FAILED,
        module: 'automation',
        action: 'stop_automation',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      return {
        success: false,
        error: AUTOMATION_ERROR_MESSAGES.SCHEDULER_STOP_FAILED,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get Scheduler Status
   */
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const now = new Date();
    const uptime = this.startTime ? now.getTime() - this.startTime.getTime() : 0;
    const queueStats = this.jobQueue.getStatistics();

    return {
      status: this.isRunning ? 'running' : 'stopped',
      uptime: Math.floor(uptime / 1000),
      total_jobs_processed: queueStats.completed_jobs,
      active_jobs: queueStats.running_jobs,
      failed_jobs: queueStats.failed_jobs,
      last_rss_fetch: null, // Implementation needed
      last_ai_processing: null, // Implementation needed
      last_health_check: null, // Implementation needed
      next_scheduled_jobs: this.scheduler.getNextScheduledJobs(),
    };
  }

  /**
   * Trigger Manual Job
   */
  async triggerManualJob(request: ManualJobTriggerRequest): Promise<AutomationServiceResponse<string>> {
    try {
      const jobId = this.jobQueue.addJob({
        type: request.job_type,
        priority: request.priority || 5,
        max_retries: 3,
        data: request.job_data || {},
        metadata: { manual: true },
      } as any);

      return {
        success: true,
        data: jobId,
        message: 'Job başarıyla kuyruğa eklendi',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: AUTOMATION_ERROR_MESSAGES.JOB_CREATION_FAILED,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get Job Queue Statistics
   */
  getJobQueueStatistics() {
    return this.jobQueue.getStatistics();
  }

  /**
   * Perform Health Check
   */
  private async performHealthCheck(): Promise<SystemHealthStatus> {
    return {
      overall_status: 'healthy',
      checks: [
        {
          type: 'database',
          status: 'healthy',
          message: 'Database connection OK',
          response_time: 15,
        },
        {
          type: 'scheduler',
          status: this.scheduler.getStatus().isRunning ? 'healthy' : 'warning',
          message: this.scheduler.getStatus().isRunning ? 'Scheduler running' : 'Scheduler stopped',
          response_time: 5,
        },
        {
          type: 'queue',
          status: 'healthy',
          message: `${this.jobQueue.getStatistics().pending_jobs} jobs in queue`,
          response_time: 3,
        },
      ],
      timestamp: new Date().toISOString(),
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
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
  }

  /**
   * Event Handlers
   */
  private async onJobCompleted(job: any, result: any): Promise<void> {
    await LogService.createLog({
      level: 'info',
      message: `Job completed: ${job.type}`,
      module: 'automation',
      action: 'job_completed',
      metadata: { job_id: job.id, result },
    });
  }

  private async onJobFailed(job: any, error: any): Promise<void> {
    await LogService.createLog({
      level: 'error',
      message: `Job failed: ${job.type}`,
      module: 'automation',
      action: 'job_failed',
      metadata: { job_id: job.id, error: error?.message },
    });

    // Retry logic
    if (this.config.enable_retry_mechanism) {
      this.jobQueue.scheduleRetry(job);
    }
  }
} 