/**
 * Scheduler Service
 * 
 * Cron job'ları ve zamanlanmış görevleri yöneten servis.
 */

import * as cron from 'node-cron';
import { EventEmitter } from 'events';
import { SCHEDULER_CONFIG, JOB_TYPES, JOB_PRIORITIES, RETRY_CONFIG } from './automation.constants';
import { SchedulerConfig, ScheduledJob } from './automation.types';
import { NewsService } from '@/features/news/news.service';
import { NewsModel } from '@/features/news/news.model';

export class SchedulerService extends EventEmitter {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private config: SchedulerConfig;
  private isRunning: boolean = false;

  constructor(config: SchedulerConfig) {
    super();
    this.config = config;
  }

  /**
   * Start All Schedulers
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    // RSS Fetch Scheduler
    const rssFetchTask = cron.schedule(this.config.rss_fetch_interval, async () => {
      this.emit('schedule_rss_fetch');
    });

    // AI Processing Scheduler
    const aiProcessingTask = cron.schedule(this.config.ai_processing_interval, async () => {
      await this.scheduleAiProcessing();
    });

    // Health Check Scheduler
    const healthCheckTask = cron.schedule(this.config.health_check_interval, async () => {
      this.emit('schedule_health_check');
    });

    // Cleanup Scheduler
    const cleanupTask = cron.schedule(this.config.cleanup_interval, async () => {
      this.emit('schedule_cleanup');
    });

    // Scheduler'ları kaydet
    this.scheduledJobs.set('rss_fetch', rssFetchTask);
    this.scheduledJobs.set('ai_processing', aiProcessingTask);
    this.scheduledJobs.set('health_check', healthCheckTask);
    this.scheduledJobs.set('cleanup', cleanupTask);

    this.isRunning = true;
  }

  /**
   * Stop All Schedulers
   */
  stop(): void {
    this.scheduledJobs.forEach(task => {
      task.stop();
      task.destroy();
    });
    this.scheduledJobs.clear();
    this.isRunning = false;
  }

  /**
   * Get Next Scheduled Jobs
   */
  getNextScheduledJobs(): ScheduledJob[] {
    return [
      {
        type: 'rss_fetch',
        next_run: this.getNextRunTime(this.config.rss_fetch_interval),
        interval: this.config.rss_fetch_interval,
        enabled: this.scheduledJobs.has('rss_fetch'),
      },
      {
        type: 'ai_processing',
        next_run: this.getNextRunTime(this.config.ai_processing_interval),
        interval: this.config.ai_processing_interval,
        enabled: this.scheduledJobs.has('ai_processing'),
      },
      {
        type: 'health_check',
        next_run: this.getNextRunTime(this.config.health_check_interval),
        interval: this.config.health_check_interval,
        enabled: this.scheduledJobs.has('health_check'),
      },
      {
        type: 'cleanup',
        next_run: this.getNextRunTime(this.config.cleanup_interval),
        interval: this.config.cleanup_interval,
        enabled: this.scheduledJobs.has('cleanup'),
      },
    ];
  }

  /**
   * Schedule AI Processing
   */
  private async scheduleAiProcessing(): Promise<void> {
    try {
      // Pending durumundaki haberleri al
      const pendingNews = await NewsModel.getPendingNewsForProcessing(SCHEDULER_CONFIG.AI_BATCH_SIZE);
      
      if (pendingNews.length === 0) {
        return;
      }

      // Kategorileri al
      const categoriesResult = await NewsService.getNewsCategories({
        page: 1,
        limit: 100,
        // is_active: true, // Tüm kategorileri al, sadece aktif olanları değil
        sort_by: 'name',
        sort_order: 'asc',
      });

      if (!categoriesResult.success || !categoriesResult.data) {
        return;
      }

      const availableCategories = categoriesResult.data.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      }));

      // Batch halinde işle
      const batchSize = SCHEDULER_CONFIG.AI_BATCH_SIZE;
      for (let i = 0; i < pendingNews.length; i += batchSize) {
        const batch = pendingNews.slice(i, i + batchSize);
        
        this.emit('schedule_batch_processing', {
          type: JOB_TYPES.BATCH_PROCESSING,
          priority: JOB_PRIORITIES.NORMAL,
          max_retries: RETRY_CONFIG.AI_MAX_RETRIES,
          data: {
            original_news_ids: batch.map(news => news.id),
            batch_size: batchSize,
            processing_type: 'ai_generation',
          },
          metadata: { availableCategories },
        });
      }
    } catch (error) {
      console.error('Error in scheduleAiProcessing:', error);
    }
  }

  /**
   * Get Next Run Time for Cron Expression
   */
  private getNextRunTime(cronExpression: string): string {
    // Basit bir implementasyon - gerçek projede cron-parser kullanılabilir
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Yaklaşık 5 dakika sonra
    return now.toISOString();
  }

  /**
   * Update Configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Eğer çalışıyorsa, restart et
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get Status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.scheduledJobs.size,
      config: this.config,
    };
  }
} 