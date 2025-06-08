/**
 * Log Feature Type Definitions
 * 
 * Log modülü için tüm TypeScript tip tanımları.
 * Frontend'den gelen log kayıtları için Request/Response DTO'ları.
 * 
 */

import { Log, LogLevel } from '@/core/types/database.types';

// ==================== LOG REQUEST DTOs ====================

/**
 * Create Log Request DTO
 * 
 * Frontend'den gelen log kaydı için gerekli veriler.
 * Kullanıcı aktivitelerini ve sistem olaylarını kaydetmek için kullanılır.
 */
export interface CreateLogRequest {
  level: LogLevel;                    // Log seviyesi (info, warning, error, debug)
  message: string;                    // Log mesajı
  module?: string;                    // Hangi modülden geldiği (örn: 'auth', 'news', 'forum')
  action?: string;                    // Yapılan aksiyon (örn: 'login', 'create_post', 'view_news')
  metadata?: Record<string, any>;     // Ek bilgiler (JSON formatında)
}

/**
 * Get Logs Query Parameters DTO
 * 
 * Log listesi için filtreleme ve sayfalama parametreleri.
 * Admin panelinde log görüntüleme için kullanılır.
 */
export interface GetLogsQuery {
  page?: number;                      // Sayfa numarası (default: 1)
  limit?: number;                     // Sayfa başına kayıt sayısı (default: 50)
  level?: LogLevel;                   // Log seviyesine göre filtreleme
  module?: string;                    // Modüle göre filtreleme
  action?: string;                    // Aksiyona göre filtreleme
  user_id?: string;                   // Kullanıcıya göre filtreleme
  start_date?: string;                // Başlangıç tarihi (ISO string)
  end_date?: string;                  // Bitiş tarihi (ISO string)
  search?: string;                    // Mesajda arama
}

// ==================== LOG RESPONSE DTOs ====================

/**
 * Log Response DTO
 * 
 * Frontend'e dönen log kaydı bilgileri.
 * Hassas bilgiler (IP, user agent) admin olmayanlara gösterilmez.
 */
export interface LogResponse {
  id: string;
  level: LogLevel;
  message: string;
  module?: string;
  action?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Admin Log Response DTO
 * 
 * Admin kullanıcılar için detaylı log bilgileri.
 * IP adresi ve user agent bilgilerini de içerir.
 */
export interface AdminLogResponse extends LogResponse {
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
}

/**
 * Paginated Logs Response DTO
 * 
 * Sayfalanmış log listesi için standart yanıt formatı.
 */
export interface PaginatedLogsResponse {
  logs: LogResponse[] | AdminLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Log Statistics Response DTO
 * 
 * Log istatistikleri için yanıt formatı.
 * Admin panelinde dashboard için kullanılır.
 */
export interface LogStatsResponse {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByModule: Record<string, number>;
  recentErrors: LogResponse[];
  topActions: Array<{
    action: string;
    count: number;
  }>;
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Log Service Response Interface
 * 
 * Tüm log servis metodlarının standart dönüş tipi.
 * Success/error durumlarını tip güvenli şekilde yönetir.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface LogServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
} 