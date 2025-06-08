/**
 * Log Feature Data Access Layer
 * 
 * Veritabanı ile log tablosu etkileşimlerini yöneten model katmanı.
 * Supabase Admin client kullanarak CRUD işlemlerini gerçekleştirir.
 * 
 */

import { supabaseAdmin } from '@/database';
import { Log, LogLevel, LogModule } from '@/core/types/database.types';
import { CreateLogRequest, GetLogsQuery } from './log.types';

/**
 * Log Model Class
 * 
 * Static metodlarla log CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class LogModel {
  
  // ==================== LOG CREATION ====================
  
  /**
   * Create New Log Entry
   * 
   * Frontend'den gelen log verisini veritabanına kaydeder.
   * IP adresi ve user agent bilgileri otomatik olarak eklenir.
   * 
   * @param logData - Log verisi
   * @param userId - Kullanıcı ID'si (opsiyonel)
   * @param ipAddress - IP adresi (opsiyonel)
   * @param userAgent - User agent (opsiyonel)
   * @param requestId - Request ID'si (opsiyonel)
   * @returns Promise<Log | null>
   */
  static async createLog(
    logData: CreateLogRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): Promise<Log | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('logs')
        .insert({
          level: logData.level,
          message: logData.message,
          module: logData.module,
          action: logData.action,
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          request_id: requestId,
          metadata: logData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createLog:', error);
      return null;
    }
  }

  // ==================== LOG RETRIEVAL METHODS ====================

  /**
   * Get Logs List (Paginated)
   * 
   * Filtreleme ve sayfalama parametreleriyle log listesini getirir.
   * Admin kullanıcılar için tüm bilgiler, normal kullanıcılar için sınırlı bilgi.
   * 
   * @param query - Filtreleme ve sayfalama parametreleri
   * @param isAdmin - Admin kullanıcı mı?
   * @returns Promise<{ logs: Log[], total: number } | null>
   */
  static async getLogs(
    query: GetLogsQuery,
    isAdmin: boolean = false
  ): Promise<{ logs: Log[], total: number } | null> {
    try {
      const {
        page = 1,
        limit = 50,
        level,
        module,
        action,
        user_id,
        start_date,
        end_date,
        search
      } = query;

      // Base query
      let queryBuilder = supabaseAdmin
        .from('logs')
        .select('*', { count: 'exact' });

      // Filtreleme
      if (level) {
        queryBuilder = queryBuilder.eq('level', level);
      }

      if (module) {
        queryBuilder = queryBuilder.eq('module', module);
      }

      if (action) {
        queryBuilder = queryBuilder.eq('action', action);
      }

      if (user_id) {
        queryBuilder = queryBuilder.eq('user_id', user_id);
      }

      if (start_date) {
        queryBuilder = queryBuilder.gte('created_at', start_date);
      }

      if (end_date) {
        queryBuilder = queryBuilder.lte('created_at', end_date);
      }

      if (search) {
        queryBuilder = queryBuilder.ilike('message', `%${search}%`);
      }

      // Sayfalama ve sıralama
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error getting logs list:', error);
        return null;
      }

      // Admin olmayan kullanıcılar için hassas bilgileri kaldır
      const logs = isAdmin ? data : data?.map(log => ({
        ...log,
        ip_address: undefined,
        user_agent: undefined,
        request_id: undefined,
      }));

      return {
        logs: logs || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getLogs:', error);
      return null;
    }
  }

  /**
   * Get Log by ID
   * 
   * ID'ye göre tek bir log kaydını getirir.
   * Admin kullanıcılar için tüm bilgiler, normal kullanıcılar için sınırlı bilgi.
   * 
   * @param id - Log ID'si
   * @param isAdmin - Admin kullanıcı mı?
   * @returns Promise<Log | null>
   */
  static async getLogById(id: string, isAdmin: boolean = false): Promise<Log | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting log by id:', error);
        return null;
      }

      // Admin olmayan kullanıcılar için hassas bilgileri kaldır
      if (!isAdmin && data) {
        return {
          ...data,
          ip_address: undefined,
          user_agent: undefined,
          request_id: undefined,
        };
      }

      return data;
    } catch (error) {
      console.error('Error in getLogById:', error);
      return null;
    }
  }

  // ==================== LOG STATISTICS METHODS ====================

  /**
   * Get Log Statistics
   * 
   * Admin paneli için log istatistiklerini hesaplar.
   * Sadece admin kullanıcılar için kullanılır.
   * 
   * @param days - Kaç günlük veri (default: 30)
   * @returns Promise<object | null>
   */
  static async getLogStats(days: number = 30): Promise<any | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Toplam log sayısı
      const { count: totalLogs } = await supabaseAdmin
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Level'a göre dağılım
      const { data: levelStats } = await supabaseAdmin
        .from('logs')
        .select('level')
        .gte('created_at', startDate.toISOString());

      const logsByLevel = levelStats?.reduce((acc, log) => {
        const level = log.level as LogLevel;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<LogLevel, number>) || {};

      // Modüle göre dağılım
      const { data: moduleStats } = await supabaseAdmin
        .from('logs')
        .select('module')
        .gte('created_at', startDate.toISOString())
        .not('module', 'is', null);

      const logsByModule = moduleStats?.reduce((acc, log) => {
        if (log.module) {
          const module = log.module as LogModule;
          acc[module] = (acc[module] || 0) + 1;
        }
        return acc;
      }, {} as Record<LogModule, number>) || {};

      // Son hatalar
      const { data: recentErrors } = await supabaseAdmin
        .from('logs')
        .select('*')
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(10);

      // En çok yapılan aksiyonlar
      const { data: actionStats } = await supabaseAdmin
        .from('logs')
        .select('action')
        .gte('created_at', startDate.toISOString())
        .not('action', 'is', null);

      const actionCounts = actionStats?.reduce((acc, log) => {
        if (log.action) {
          acc[log.action] = (acc[log.action] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalLogs: totalLogs || 0,
        logsByLevel,
        logsByModule,
        recentErrors: recentErrors?.map(log => ({
          ...log,
          ip_address: undefined,
          user_agent: undefined,
          request_id: undefined,
        })) || [],
        topActions
      };
    } catch (error) {
      console.error('Log model getLogStats hatası:', error);
      return null;
    }
  }

  /**
   * Eski Log Kayıtlarını Temizleme
   * 
   * Belirtilen günden eski log kayıtlarını siler.
   * Sadece sistem tarafından çağrılmalı (cron job vs.)
   * 
   * @param days - Kaç günden eski kayıtlar silinecek
   * @returns Promise<number> - Silinen kayıt sayısı
   */
  static async cleanOldLogs(days: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabaseAdmin
        .from('logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Eski log temizleme hatası:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Log model cleanOldLogs hatası:', error);
      return 0;
    }
  }
}