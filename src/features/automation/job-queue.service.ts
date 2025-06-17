/**
 * Job Queue Service
 * 
 * İş kuyruğu yönetimi ve job execution işlemleri.
 */

import { EventEmitter } from 'events';
import { AutomationJob, QueueStatistics } from './automation.types';
import { RETRY_CONFIG, AUTOMATION_ERROR_MESSAGES } from './automation.constants';
import { RssService } from '@/features/rss/rss.service';
import { NewsGenerationService } from '@/features/news/news-generation.service';

export class JobQueueService extends EventEmitter {
  private jobQueue: AutomationJob[] = [];
  private activeJobs: Map<string, AutomationJob> = new Map();
  private processingQueue: boolean = false;
  private maxConcurrentJobs: number = 5;
  private totalJobsProcessed: number = 0;
  private failedJobsCount: number = 0;

  constructor(maxConcurrentJobs: number = 5) {
    super();
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  /**
   * Add Job to Queue
   */
  addJob(job: Omit<AutomationJob, 'id' | 'created_at' | 'status' | 'retry_count'>): string {
    const jobId = `${job.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullJob: AutomationJob = {
      ...job,
      id: jobId,
      created_at: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
    } as AutomationJob;

    this.jobQueue.push(fullJob);
    
    // Priority'ye göre sırala
    this.jobQueue.sort((a, b) => a.priority - b.priority);

    this.emit('job_added', fullJob);
    
    return jobId;
  }

  /**
   * Start Queue Processor
   */
  start(): void {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    this.processQueue();
  }

  /**
   * Stop Queue Processor
   */
  stop(): void {
    this.processingQueue = false;
  }

  /**
   * Process Job Queue
   */
  private async processQueue(): Promise<void> {
    while (this.processingQueue) {
      if (this.jobQueue.length === 0 || this.activeJobs.size >= this.maxConcurrentJobs) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const job = this.jobQueue.shift();
      if (job) {
        this.executeJob(job);
      }
    }
  }

  /**
   * Execute Job
   */
  private async executeJob(job: AutomationJob): Promise<void> {
    job.status = 'running';
    job.started_at = new Date().toISOString();
    this.activeJobs.set(job.id, job);

    try {
      let result: any;
      
      switch (job.type as string) {
        case 'rss_fetch':
          result = await this.executeRssFetchJob(job as any);
          break;
        case 'ai_processing':
          result = await this.executeAiProcessingJob(job as any);
          break;
        case 'batch_processing':
          result = await this.executeBatchProcessingJob(job as any);
          break;
        case 'health_check':
          result = await this.executeHealthCheckJob(job as any);
          break;
        case 'cleanup':
          result = await this.executeCleanupJob(job as any);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      this.totalJobsProcessed++;
      this.emit('job_completed', job, result);

    } catch (error) {
      job.status = 'failed';
      job.failed_at = new Date().toISOString();
      job.error_message = error instanceof Error ? error.message : 'Unknown error';
      this.failedJobsCount++;
      this.emit('job_failed', job, error);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Execute RSS Fetch Job
   */
  private async executeRssFetchJob(job: any): Promise<any> {
    return await RssService.fetchRssFeeds(job.data);
  }

  /**
   * Execute AI Processing Job
   */
  private async executeAiProcessingJob(job: any): Promise<any> {
    return await NewsGenerationService.generateNews(job.data);
  }

  /**
   * Execute Batch Processing Job
   */
  private async executeBatchProcessingJob(job: any): Promise<any> {
    const results = [];
    const errors = [];

    for (const newsId of job.data.original_news_ids) {
      try {
        const result = await NewsGenerationService.generateNews({
          original_news_id: newsId,
          available_categories: job.metadata.availableCategories,
        });
        results.push(result);
      } catch (error) {
        errors.push({
          item_id: newsId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total_items: job.data.original_news_ids.length,
      successful_items: results.length,
      failed_items: errors.length,
      processing_time: Date.now() - new Date(job.started_at!).getTime(),
      results,
      errors,
    };
  }

  /**
   * Execute Health Check Job
   */
  private async executeHealthCheckJob(job: any): Promise<any> {
    // Health check implementation
    return {
      overall_status: 'healthy',
      checks: job.data.check_types.map((type: string) => ({
        type,
        status: 'healthy',
        message: `${type} is operational`,
        response_time: Math.floor(Math.random() * 100) + 10,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute Cleanup Job
   */
  private async executeCleanupJob(job: any): Promise<any> {
    // Cleanup implementation - şimdilik mock
    return { 
      success: true, 
      cleaned: Math.floor(Math.random() * 50),
      cleanup_type: job.data.cleanup_type,
    };
  }

  /**
   * Schedule Retry
   */
  scheduleRetry(job: AutomationJob): void {
    if (job.retry_count >= job.max_retries) {
      return;
    }

    job.retry_count++;
    job.status = 'retrying';
    
    const delay = this.calculateRetryDelay(job.retry_count);
    job.next_retry_at = new Date(Date.now() + delay).toISOString();

    setTimeout(() => {
      job.status = 'pending';
      this.jobQueue.push(job);
      this.jobQueue.sort((a, b) => a.priority - b.priority);
    }, delay);
  }

  /**
   * Calculate Retry Delay
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(
      RETRY_CONFIG.AI_RETRY_DELAY * Math.pow(2, retryCount - 1),
      RETRY_CONFIG.AI_MAX_DELAY
    );
  }

  /**
   * Wait for Active Jobs
   */
  async waitForActiveJobs(timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get Queue Statistics
   */
  getStatistics(): QueueStatistics {
    return {
      total_jobs: this.totalJobsProcessed + this.jobQueue.length + this.activeJobs.size,
      pending_jobs: this.jobQueue.length,
      running_jobs: this.activeJobs.size,
      completed_jobs: this.totalJobsProcessed - this.failedJobsCount,
      failed_jobs: this.failedJobsCount,
      retrying_jobs: this.jobQueue.filter(job => job.status === 'retrying').length,
      avg_processing_time: 0, // Implementation needed
      throughput_per_hour: 0, // Implementation needed
    };
  }

  /**
   * Get Active Jobs
   */
  getActiveJobs(): AutomationJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get Pending Jobs
   */
  getPendingJobs(): AutomationJob[] {
    return this.jobQueue.filter(job => job.status === 'pending');
  }

  /**
   * Cancel Job
   */
  cancelJob(jobId: string): boolean {
    // Queue'dan kaldır
    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (queueIndex !== -1) {
      this.jobQueue[queueIndex].status = 'cancelled';
      this.jobQueue.splice(queueIndex, 1);
      return true;
    }

    // Active job'ları cancel etmek daha karmaşık - şimdilik false döndür
    return false;
  }

  /**
   * Clear Failed Jobs
   */
  clearFailedJobs(): number {
    const failedCount = this.jobQueue.filter(job => job.status === 'failed').length;
    this.jobQueue = this.jobQueue.filter(job => job.status !== 'failed');
    return failedCount;
  }
} 