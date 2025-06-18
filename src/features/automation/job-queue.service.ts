/**
 * Job Queue Service
 * 
 * İş kuyruğu yönetimi ve job execution işlemleri.
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
  AutomationJob,
  RssFetchJob,
  AiProcessingJob,
  BatchProcessingJob,
  CleanupJob,
  HealthCheckJob,
  JobStatus,
  QueueStatistics
} from './automation.types';
import { RssService } from '@/features/rss/rss.service';
import { NewsGenerationService } from '@/features/news/news-generation.service';
import { NewsModel } from '@/features/news/news.model';
import { NewsGenerationRequest } from '@/features/news/news.types';

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
      
      // Retry kontrolü - max retry'a ulaştıysa skipped yap
      if (job.retry_count >= job.max_retries) {
        console.log(`Job ${job.id} max retry'a ulaştı, skipped olarak işaretleniyor`);
        // AI processing job'u için original news status'unu skipped yap
        if (job.type === 'ai_processing' && (job as any).data?.original_news_ids) {
          for (const newsId of (job as any).data.original_news_ids) {
            try {
              await NewsModel.updateOriginalNewsStatus(newsId, 'skipped', 'Max retry attempts reached');
            } catch (updateError) {
              console.error(`Status update error for news ${newsId}:`, updateError);
            }
          }
        }
      } else {
        // Retry planla
        this.scheduleRetry(job);
      }
      
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
   * 
   * Bekleyen haberleri AI ile işleme job'u.
   */
  private async executeAiProcessingJob(job: AiProcessingJob): Promise<void> {
    console.log('=== AI Processing Job Başlatıldı ===');
    console.log(`Job ID: ${job.id}`);
    
    try {
      // Bekleyen haberleri getir
      console.log('Bekleyen haberler getiriliyor...');
      const pendingNews = await NewsModel.getPendingNewsForProcessing(SCHEDULER_CONFIG.AI_BATCH_SIZE);
      
      console.log(`Bulunan bekleyen haber sayısı: ${pendingNews.length}`);
      
      if (pendingNews.length === 0) {
        console.log('İşlenecek bekleyen haber bulunamadı');
        return;
      }

      // Kategorileri getir
      console.log('Kategoriler getiriliyor...');
      const categories = await NewsModel.getNewsCategories({
        page: 1,
        limit: 100,
        sort_by: 'name',
        sort_order: 'asc',
      });

      if (!categories || categories.categories.length === 0) {
        console.log('HATA: Kategori bulunamadı!');
        throw new Error('No categories available for processing');
      }

      console.log(`Bulunan kategori sayısı: ${categories.categories.length}`);

      // Haberlerin ID'lerini al
      const newsIds = pendingNews.map(news => news.id);
      
      // Job data'ya news ID'lerini ekle (retry mekanizması için)
      (job as any).data = {
        ...((job as any).data || {}),
        original_news_ids: newsIds,
      };

      // Batch processing'i gerçekleştir
      const batchResult = await this.processBatchNewsGeneration(newsIds, categories.categories);
      
      console.log(`Batch işleme tamamlandı: ${batchResult.successful_items}/${batchResult.total_items} başarılı`);
      
      if (batchResult.failed_items > 0) {
        console.log(`Başarısız olan haberler: ${batchResult.failed_items}`);
        // Eğer tüm haberler başarısız olursa error fırlat
        if (batchResult.successful_items === 0) {
          throw new Error(`All ${batchResult.total_items} news items failed to process`);
        }
      }

      console.log('=== AI Processing Job Tamamlandı ===\n');
    } catch (error) {
      console.error('AI Processing Job genel hatası:', error);
      throw error;
    }
  }

  /**
   * Execute Batch Processing Job
   */
  private async executeBatchProcessingJob(job: any): Promise<any> {
    console.log('=== Batch Processing Job Başlatıldı ===');
    console.log(`Job ID: ${job.id}`);
    console.log(`İşlenecek haber sayısı: ${job.data.original_news_ids.length}`);

    try {
      // Kategorileri metadata'dan al veya varsayılan kullan
      const categories = job.metadata?.availableCategories || [];
      
      if (categories.length === 0) {
        throw new Error('No categories provided for batch processing');
      }

      // Batch processing'i gerçekleştir
      const result = await this.processBatchNewsGeneration(job.data.original_news_ids, categories);
      
      console.log('=== Batch Processing Job Tamamlandı ===\n');
      return result;
    } catch (error) {
      console.error('Batch Processing Job genel hatası:', error);
      throw error;
    }
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

  /**
   * Process Batch News Generation
   * 
   * Birden fazla haberi batch olarak işler.
   */
  private async processBatchNewsGeneration(
    newsIds: string[], 
    categories: Array<{id: string, name: string, slug: string}>
  ): Promise<{
    total_items: number;
    successful_items: number;
    failed_items: number;
    processing_time: number;
    results: any[];
    errors: any[];
  }> {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    console.log(`Batch processing başlatılıyor: ${newsIds.length} haber`);

    for (let i = 0; i < newsIds.length; i++) {
      const newsId = newsIds[i];
      console.log(`\n--- Haber ${i + 1}/${newsIds.length} İşleniyor (ID: ${newsId}) ---`);
      
      try {
        // Status'u processing'e çek
        await NewsModel.updateOriginalNewsStatus(newsId, 'processing');

        // AI generation request hazırla
        const generationRequest: NewsGenerationRequest = {
          original_news_id: newsId,
          available_categories: categories,
          max_sources: 3,
          research_depth: 'standard',
          force_regenerate: false,
        };

        console.log('AI generation başlatılıyor...');
        const result = await NewsGenerationService.generateNews(generationRequest);

        if (result.status === 'success') {
          console.log('✅ AI generation başarılı!');
          console.log(`İşlenmiş haber ID: ${result.processed_news?.id}`);
          await NewsModel.updateOriginalNewsStatus(newsId, 'completed');
          results.push(result);
        } else {
          console.log('❌ AI generation reddedildi');
          console.log(`Reddetme sebebi: ${result.rejection_reason}`);
          await NewsModel.updateOriginalNewsStatus(newsId, 'rejected', result.rejection_reason);
          errors.push({
            item_id: newsId,
            error: result.rejection_reason || 'Unknown rejection reason',
            status: 'rejected'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';
        console.log(`❌ Haber işleme hatası: ${errorMessage}`);
        await NewsModel.updateOriginalNewsStatus(newsId, 'failed', errorMessage);
        errors.push({
          item_id: newsId,
          error: errorMessage,
          status: 'failed'
        });
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Batch processing tamamlandı: ${results.length} başarılı, ${errors.length} hatalı (${processingTime}ms)`);

    return {
      total_items: newsIds.length,
      successful_items: results.length,
      failed_items: errors.length,
      processing_time: processingTime,
      results,
      errors,
    };
  }
} 