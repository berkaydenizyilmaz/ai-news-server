/**
 * Automation Feature Index
 * 
 * Otomatikleştirme modülü için tüm export'ları toplar.
 */

// Main services
export { AutomationService } from './automation.service';
export { SchedulerService } from './scheduler.service';
export { JobQueueService } from './job-queue.service';

// HTTP layer
export { AutomationController } from './automation.controller';
export { automationRoutes } from './automation.routes';

// Types and constants
export * from './automation.types';
export * from './automation.constants'; 