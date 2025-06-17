/**
 * Automation Feature Types
 * 
 * Otomatikleştirme modülü için TypeScript tip tanımları.
 * Job queue, scheduler ve monitoring tipleri.
 */

import { OriginalNews, ProcessedNews, RssSource } from '@/core/types/database.types';

// ==================== JOB TYPES ====================

/**
 * Base Job Interface
 */
export interface BaseJob {
  id: string;
  type: string;
  priority: number;
  status: JobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * RSS Fetch Job
 */
export interface RssFetchJob extends BaseJob {
  type: 'rss_fetch';
  data: {
    source_id?: string; // Belirli bir kaynak için, yoksa tümü
    max_items?: number;
    force_fetch?: boolean;
  };
}

/**
 * AI Processing Job
 */
export interface AiProcessingJob extends BaseJob {
  type: 'ai_processing';
  data: {
    original_news_id: string;
    available_categories: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    research_depth?: 'basic' | 'deep';
  };
}

/**
 * Batch Processing Job
 */
export interface BatchProcessingJob extends BaseJob {
  type: 'batch_processing';
  data: {
    original_news_ids: string[];
    batch_size?: number;
    processing_type: 'ai_generation' | 'category_update' | 'cleanup';
  };
}

/**
 * Cleanup Job
 */
export interface CleanupJob extends BaseJob {
  type: 'cleanup';
  data: {
    cleanup_type: 'logs' | 'failed_jobs' | 'old_news' | 'temp_files';
    retention_days?: number;
    dry_run?: boolean;
  };
}

/**
 * Health Check Job
 */
export interface HealthCheckJob extends BaseJob {
  type: 'health_check';
  data: {
    check_types: string[];
    detailed?: boolean;
  };
}

/**
 * Union Type for All Jobs
 */
export type AutomationJob = RssFetchJob | AiProcessingJob | BatchProcessingJob | CleanupJob | HealthCheckJob;

// ==================== JOB STATUS TYPES ====================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export type AutomationStatus = 'running' | 'stopped' | 'paused' | 'error' | 'maintenance';

// ==================== SCHEDULER TYPES ====================

/**
 * Scheduler Configuration
 */
export interface SchedulerConfig {
  rss_fetch_interval: string;
  ai_processing_interval: string;
  health_check_interval: string;
  cleanup_interval: string;
  max_concurrent_jobs: number;
  enable_retry_mechanism: boolean;
  enable_circuit_breaker: boolean;
}

/**
 * Scheduler Status
 */
export interface SchedulerStatus {
  status: AutomationStatus;
  uptime: number;
  total_jobs_processed: number;
  active_jobs: number;
  failed_jobs: number;
  last_rss_fetch: string | null;
  last_ai_processing: string | null;
  last_health_check: string | null;
  next_scheduled_jobs: ScheduledJob[];
}

/**
 * Scheduled Job Info
 */
export interface ScheduledJob {
  type: string;
  next_run: string;
  interval: string;
  enabled: boolean;
}

// ==================== PROCESSING RESULTS ====================

/**
 * RSS Fetch Result
 */
export interface AutomationRssFetchResult {
  success: boolean;
  source_id: string;
  source_name: string;
  items_fetched: number;
  new_items: number;
  processing_time: number;
  error?: string;
}

/**
 * AI Processing Result
 */
export interface AutomationAiProcessingResult {
  success: boolean;
  original_news_id: string;
  processed_news_id?: string;
  processing_status: 'completed' | 'rejected' | 'failed';
  processing_time: number;
  confidence_score?: number;
  rejection_reason?: string;
  error?: string;
}

/**
 * Batch Processing Result
 */
export interface BatchProcessingResult {
  total_items: number;
  successful_items: number;
  failed_items: number;
  processing_time: number;
  results: (AutomationRssFetchResult | AutomationAiProcessingResult)[];
  errors: Array<{
    item_id: string;
    error: string;
  }>;
}

// ==================== HEALTH CHECK TYPES ====================

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  type: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  response_time?: number;
  details?: Record<string, any>;
}

/**
 * System Health Status
 */
export interface SystemHealthStatus {
  overall_status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheckResult[];
  timestamp: string;
  uptime: number;
  memory_usage: {
    used: number;
    total: number;
    percentage: number;
  };
  database_status: {
    connected: boolean;
    query_time: number;
    active_connections: number;
  };
}

// ==================== MONITORING TYPES ====================

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  timestamp: string;
  rss_fetch_metrics: {
    total_sources: number;
    successful_fetches: number;
    failed_fetches: number;
    avg_fetch_time: number;
    total_items_fetched: number;
  };
  ai_processing_metrics: {
    total_processed: number;
    successful_generations: number;
    rejected_items: number;
    failed_items: number;
    avg_processing_time: number;
    avg_confidence_score: number;
  };
  system_metrics: {
    memory_usage: number;
    cpu_usage: number;
    disk_usage: number;
    active_jobs: number;
    queue_size: number;
  };
}

/**
 * Error Tracking
 */
export interface ErrorTrackingInfo {
  error_type: string;
  error_message: string;
  error_count: number;
  first_occurrence: string;
  last_occurrence: string;
  affected_components: string[];
  resolution_status: 'open' | 'investigating' | 'resolved';
}

// ==================== CIRCUIT BREAKER TYPES ====================

/**
 * Circuit Breaker State
 */
export interface CircuitBreakerState {
  service_name: string;
  state: 'closed' | 'open' | 'half_open';
  failure_count: number;
  last_failure_time?: string;
  next_attempt_time?: string;
  success_threshold: number;
  failure_threshold: number;
}

// ==================== RETRY MECHANISM TYPES ====================

/**
 * Retry Configuration
 */
export interface RetryConfig {
  max_retries: number;
  base_delay: number;
  max_delay: number;
  backoff_type: 'exponential' | 'linear' | 'fixed';
  jitter: boolean;
}

/**
 * Retry Attempt Info
 */
export interface RetryAttempt {
  attempt_number: number;
  scheduled_at: string;
  executed_at?: string;
  success: boolean;
  error?: string;
  next_attempt_at?: string;
}

// ==================== QUEUE TYPES ====================

/**
 * Queue Statistics
 */
export interface QueueStatistics {
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  retrying_jobs: number;
  avg_processing_time: number;
  throughput_per_hour: number;
}

/**
 * Queue Configuration
 */
export interface QueueConfig {
  max_concurrent_jobs: number;
  job_timeout: number;
  retry_delay: number;
  max_retries: number;
  priority_enabled: boolean;
  rate_limiting: {
    enabled: boolean;
    max_jobs_per_minute: number;
  };
}

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Start Automation Request
 */
export interface StartAutomationRequest {
  config?: Partial<SchedulerConfig>;
  force_start?: boolean;
}

/**
 * Stop Automation Request
 */
export interface StopAutomationRequest {
  graceful_shutdown?: boolean;
  timeout?: number;
}

/**
 * Manual Job Trigger Request
 */
export interface ManualJobTriggerRequest {
  job_type: string;
  job_data?: Record<string, any>;
  priority?: number;
  delay?: number;
}

/**
 * Automation Service Response
 */
export interface AutomationServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
} 