/**
 * Log Feature Business Logic Layer
 * 
 * Log işlemlerinin iş mantığını yöneten servis katmanı.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 * 
 */

import { LogModel } from './log.model';
import { 
  CreateLogRequest, 
  GetLogsQuery, 
  LogServiceResponse,
  PaginatedLogsResponse,
  LogStatsResponse,
  LogResponse,
  AdminLogResponse
} from './log.types';
import { LogModule } from '@/core/types/database.types';
import { 
  QUERY_CONSTRAINTS,
  DATE_CONSTRAINTS,
  LOG_ERROR_MESSAGES,
  LOG_SUCCESS_MESSAGES 
} from './log.constants';

/**
 * Log Service Class
 * 
 * Static metodlarla log iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class LogService {

  // ==================== LOG CREATION ====================

  /**
   * Create Log Business Logic
   * 
   * Frontend'den gelen log verisini işleyerek veritabanına kaydeder.
   * Gerekli validasyonları yapar ve ek bilgileri ekler.
   * 
   * @param logData - Log verisi
   * @param userId - Kullanıcı ID'si (opsiyonel)
   * @param ipAddress - IP adresi (opsiyonel)
   * @param userAgent - User agent (opsiyonel)
   * @param requestId - Request ID'si (opsiyonel)
   * @returns Promise<LogServiceResponse<LogResponse>>
   */
  static async createLog(
    logData: CreateLogRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<LogServiceResponse<LogResponse>> {
    try {
      // Log mesajını temizle ve kısalt
      const cleanedLogData: CreateLogRequest = {
        ...logData,
        message: logData.message.trim(),
        module: logData.module?.trim() as LogModule | undefined,
        action: logData.action?.trim(),
      };

      // Metadata boyutunu kontrol et
      if (cleanedLogData.metadata) {
        const metadataSize = JSON.stringify(cleanedLogData.metadata).length;
        if (metadataSize > QUERY_CONSTRAINTS.METADATA_MAX_SIZE) {
          return {
            success: false,
            error: LOG_ERROR_MESSAGES.METADATA_TOO_LARGE,
          };
        }
      }

      const createdLog = await LogModel.createLog(
        cleanedLogData,
        userId,
        ipAddress,
        userAgent,
        requestId
      );

      if (!createdLog) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.LOG_CREATION_FAILED,
        };
      }

      // Hassas bilgileri kaldırarak response oluştur
      const logResponse: LogResponse = {
        id: createdLog.id,
        level: createdLog.level,
        message: createdLog.message,
        module: createdLog.module,
        action: createdLog.action,
        user_id: createdLog.user_id,
        metadata: createdLog.metadata,
        created_at: createdLog.created_at,
        updated_at: createdLog.updated_at,
      };

      return {
        success: true,
        data: logResponse,
        message: LOG_SUCCESS_MESSAGES.LOG_CREATED,
      };
    } catch (error) {
      console.error('Error in createLog service:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.LOG_CREATION_FAILED,
      };
    }
  }

  // ==================== LOG RETRIEVAL ====================

  /**
   * Get Logs List Business Logic
   * 
   * Filtreleme ve sayfalama parametreleriyle log listesini getirir.
   * Kullanıcı rolüne göre farklı bilgi seviyeleri döner.
   * 
   * @param query - Filtreleme ve sayfalama parametreleri
   * @param isAdmin - Admin kullanıcı mı?
   * @returns Promise<LogServiceResponse<PaginatedLogsResponse>>
   */
  static async getLogs(
    query: GetLogsQuery,
    isAdmin: boolean = false
  ): Promise<LogServiceResponse<PaginatedLogsResponse>> {
    try {
      const result = await LogModel.getLogs(query, isAdmin);

      if (!result) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.LOGS_FETCH_FAILED,
        };
      }

      const { logs, total } = result;
      const { page = QUERY_CONSTRAINTS.PAGE_MIN, limit = QUERY_CONSTRAINTS.LIMIT_DEFAULT } = query;

      // Pagination bilgilerini hesapla
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      // Response formatını oluştur
      const formattedLogs = logs.map(log => {
        if (isAdmin) {
          return log as AdminLogResponse;
        } else {
          const { ip_address, user_agent, request_id, ...publicLog } = log;
          return publicLog as LogResponse;
        }
      });

      const response: PaginatedLogsResponse = {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };

      return {
        success: true,
        data: response,
        message: LOG_SUCCESS_MESSAGES.LOGS_FETCHED,
      };
    } catch (error) {
      console.error('Log service getLogs hatası:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.LOGS_FETCH_FAILED,
      };
    }
  }

  /**
   * Tek Log Kaydı Getirme
   * 
   * ID'ye göre tek bir log kaydını getirir.
   * Kullanıcı rolüne göre farklı bilgi seviyeleri döner.
   * 
   * @param id - Log ID'si
   * @param isAdmin - Admin kullanıcı mı?
   * @returns Promise<LogServiceResponse<LogResponse | AdminLogResponse>>
   */
  static async getLogById(
    id: string,
    isAdmin: boolean = false
  ): Promise<LogServiceResponse<LogResponse | AdminLogResponse>> {
    try {
      const log = await LogModel.getLogById(id, isAdmin);

      if (!log) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.LOG_NOT_FOUND,
        };
      }

      // Response formatını oluştur
      if (isAdmin) {
        return {
          success: true,
          data: log as AdminLogResponse,
          message: LOG_SUCCESS_MESSAGES.LOG_FETCHED,
        };
      } else {
        const { ip_address, user_agent, request_id, ...publicLog } = log;
        return {
          success: true,
          data: publicLog as LogResponse,
          message: LOG_SUCCESS_MESSAGES.LOG_FETCHED,
        };
      }
    } catch (error) {
      console.error('Log service getLogById hatası:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.LOG_NOT_FOUND,
      };
    }
  }

  /**
   * Log İstatistikleri Getirme
   * 
   * Admin paneli için log istatistiklerini hesaplar.
   * Sadece admin kullanıcılar için kullanılır.
   * 
   * @param days - Kaç günlük veri (default: 30)
   * @returns Promise<LogServiceResponse<LogStatsResponse>>
   */
  static async getLogStats(days: number = DATE_CONSTRAINTS.DEFAULT_STATS_DAYS): Promise<LogServiceResponse<LogStatsResponse>> {
    try {
      // Gün sayısını kontrol et
      if (days < 1 || days > 365) {
        return {
          success: false,
          error: 'Gün sayısı 1-365 arasında olmalıdır',
        };
      }

      const stats = await LogModel.getLogStats(days);

      if (!stats) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.STATS_FETCH_FAILED,
        };
      }

      return {
        success: true,
        data: stats as LogStatsResponse,
        message: LOG_SUCCESS_MESSAGES.STATS_FETCHED,
      };
    } catch (error) {
      console.error('Log service getLogStats hatası:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.STATS_FETCH_FAILED,
      };
    }
  }

  /**
   * Eski Log Kayıtlarını Temizleme
   * 
   * Belirtilen günden eski log kayıtlarını siler.
   * Sadece sistem yöneticileri tarafından kullanılmalı.
   * 
   * @param days - Kaç günden eski kayıtlar silinecek (default: 90)
   * @returns Promise<LogServiceResponse<{ deletedCount: number }>>
   */
  static async cleanOldLogs(days: number = DATE_CONSTRAINTS.DEFAULT_CLEANUP_DAYS): Promise<LogServiceResponse<{ deletedCount: number }>> {
    try {
      // Gün sayısını kontrol et
      if (days < DATE_CONSTRAINTS.MIN_RETENTION_DAYS) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.MIN_RETENTION_ERROR,
        };
      }

      if (days > DATE_CONSTRAINTS.MAX_CLEANUP_DAYS) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.MAX_CLEANUP_ERROR,
        };
      }

      const deletedCount = await LogModel.cleanOldLogs(days);

      return {
        success: true,
        data: { deletedCount },
        message: `${deletedCount} adet eski log kaydı temizlendi`,
      };
    } catch (error) {
      console.error('Log service cleanOldLogs hatası:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.CLEANUP_FAILED,
      };
    }
  }

  /**
   * Kullanıcının Log Kayıtlarını Getirme
   * 
   * Belirli bir kullanıcının log kayıtlarını getirir.
   * Kullanıcı kendi loglarını görebilir, admin tüm logları görebilir.
   * 
   * @param userId - Kullanıcı ID'si
   * @param query - Filtreleme ve sayfalama parametreleri
   * @param requestingUserId - İsteği yapan kullanıcının ID'si
   * @param isAdmin - Admin kullanıcı mı?
   * @returns Promise<LogServiceResponse<PaginatedLogsResponse>>
   */
  static async getUserLogs(
    userId: string,
    query: GetLogsQuery,
    requestingUserId?: string,
    isAdmin: boolean = false
  ): Promise<LogServiceResponse<PaginatedLogsResponse>> {
    try {
      // Yetki kontrolü: Kullanıcı kendi loglarını veya admin tüm logları görebilir
      if (!isAdmin && requestingUserId !== userId) {
        return {
          success: false,
          error: LOG_ERROR_MESSAGES.UNAUTHORIZED,
        };
      }

      // Query'ye user_id ekle
      const userQuery = {
        ...query,
        user_id: userId,
      };

      return await this.getLogs(userQuery, isAdmin);
    } catch (error) {
      console.error('Log service getUserLogs hatası:', error);
      return {
        success: false,
        error: LOG_ERROR_MESSAGES.LOGS_FETCH_FAILED,
      };
    }
  }
} 