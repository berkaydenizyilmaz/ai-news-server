/**
 * Reports Feature Data Access Layer
 * 
 * Supabase veritabanı ile report işlemleri için CRUD operasyonları.
 * Şikayet yönetimi ve moderasyon işlemleri için veritabanı sorgularını içerir.
 * 
 */

import { supabaseAdmin } from '@/database';
import { Report } from '@/core/types/database.types';
import { CreateReportInput, ReviewReportInput, ReportQueryInput } from './reports.validation';
import { ReportWithDetails, ReportStatistics, ContentValidationResult } from './reports.types';

/**
 * Reports Model Class
 * 
 * Static metodlarla Report CRUD işlemlerini yönetir.
 * Supabase Admin client kullanarak RLS kurallarını bypass eder.
 */
export class ReportsModel {
  
  // ==================== REPORT CRUD OPERATIONS ====================
  
  /**
   * Create New Report
   * 
   * Yeni şikayet oluşturur.
   * 
   * @param reportData - Şikayet bilgileri
   * @param reporterId - Şikayet eden kullanıcı ID'si
   * @returns {Promise<Report | null>} Oluşturulan şikayet veya null
   */
  static async createReport(
    reportData: CreateReportInput, 
    reporterId: string
  ): Promise<Report | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_type: reportData.reported_type,
          reported_id: reportData.reported_id,
          reason: reportData.reason,
          description: reportData.description,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createReport:', error);
      return null;
    }
  }

  /**
   * Get Reports with Pagination and Filters
   * 
   * Şikayetleri sayfalama ve filtreleme ile getirir.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<{reports: ReportWithDetails[], total: number} | null>}
   */
  static async getReports(queryParams: ReportQueryInput): Promise<{
    reports: ReportWithDetails[];
    total: number;
  } | null> {
    try {
      let query = supabaseAdmin
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(id, username, email, role),
          reviewer:users!reviewed_by(id, username, role)
        `, { count: 'exact' });

      // Filtreleme
      if (queryParams.status) {
        query = query.eq('status', queryParams.status);
      }

      if (queryParams.reported_type) {
        query = query.eq('reported_type', queryParams.reported_type);
      }

      if (queryParams.search) {
        query = query.or(`reason.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`);
      }

      if (queryParams.date_from) {
        query = query.gte('created_at', queryParams.date_from);
      }

      if (queryParams.date_to) {
        query = query.lte('created_at', queryParams.date_to);
      }

      // Sayfalama
      const offset = (queryParams.page - 1) * queryParams.limit;
      query = query
        .range(offset, offset + queryParams.limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        return null;
      }

      return {
        reports: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getReports:', error);
      return null;
    }
  }

  /**
   * Get Report by ID with Details
   * 
   * ID'ye göre şikayeti detaylarıyla birlikte getirir.
   * 
   * @param id - Şikayet ID'si
   * @returns {Promise<ReportWithDetails | null>}
   */
  static async getReportById(id: string): Promise<ReportWithDetails | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(id, username, email, role),
          reviewer:users!reviewed_by(id, username, role)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching report by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getReportById:', error);
      return null;
    }
  }

  /**
   * Review Report
   * 
   * Şikayeti değerlendirir ve durumunu günceller.
   * 
   * @param id - Şikayet ID'si
   * @param reviewData - Değerlendirme verisi
   * @param reviewerId - Değerlendiren moderatör ID'si
   * @returns {Promise<Report | null>}
   */
  static async reviewReport(
    id: string, 
    reviewData: ReviewReportInput,
    reviewerId: string
  ): Promise<Report | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .update({
          status: reviewData.status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error reviewing report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in reviewReport:', error);
      return null;
    }
  }

  /**
   * Delete Report
   * 
   * Şikayeti siler.
   * 
   * @param id - Şikayet ID'si
   * @returns {Promise<boolean>}
   */
  static async deleteReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting report:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteReport:', error);
      return false;
    }
  }

  // ==================== CONTENT VALIDATION METHODS ====================

  /**
   * Validate Reported Content
   * 
   * Şikayet edilen içeriğin varlığını ve geçerliliğini kontrol eder.
   * 
   * @param contentType - İçerik türü
   * @param contentId - İçerik ID'si
   * @returns {Promise<ContentValidationResult>}
   */
  static async validateReportedContent(
    contentType: string, 
    contentId: string
  ): Promise<ContentValidationResult> {
    try {
      let tableName: string;
      let selectFields: string;

      switch (contentType) {
        case 'news':
          tableName = 'processed_news';
          selectFields = 'id, title';
          break;
        case 'comment':
          tableName = 'comments';
          selectFields = 'id, content, is_deleted, user_id';
          break;
        case 'forum_post':
          tableName = 'forum_posts';
          selectFields = 'id, content, is_deleted, user_id';
          break;
        case 'forum_topic':
          tableName = 'forum_topics';
          selectFields = 'id, title, status, user_id';
          break;
        default:
          return {
            exists: false,
            content_type: contentType,
            content_id: contentId,
            is_active: false,
          };
      }

      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(selectFields)
        .eq('id', contentId)
        .single();

      if (error || !data) {
        return {
          exists: false,
          content_type: contentType,
          content_id: contentId,
          is_active: false,
        };
      }

      // Type assertion ile data tipini belirtelim
      const contentData = data as any;

      const isActive = contentType === 'news' 
        ? true // Processed news items are always active/published
        : contentType === 'forum_topic'
        ? contentData.status === 'active'
        : !contentData.is_deleted;

      return {
        exists: true,
        content_type: contentType,
        content_id: contentId,
        author_id: contentData.user_id || null, // News don't have user_id
        title: contentData.title || contentData.content?.substring(0, 50),
        is_active: isActive,
      };
    } catch (error) {
      console.error('Error in validateReportedContent:', error);
      return {
        exists: false,
        content_type: contentType,
        content_id: contentId,
        is_active: false,
      };
    }
  }

  /**
   * Check Duplicate Report
   * 
   * Aynı kullanıcının aynı içerik için daha önce şikayet gönderip göndermediğini kontrol eder.
   * 
   * @param reporterId - Şikayet eden kullanıcı ID'si
   * @param contentType - İçerik türü
   * @param contentId - İçerik ID'si
   * @returns {Promise<boolean>} Duplicate varsa true
   */
  static async checkDuplicateReport(
    reporterId: string,
    contentType: string,
    contentId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('reported_type', contentType)
        .eq('reported_id', contentId)
        .limit(1);

      if (error) {
        console.error('Error checking duplicate report:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error in checkDuplicateReport:', error);
      return false;
    }
  }

  // ==================== STATISTICS METHODS ====================

  /**
   * Get Report Statistics
   * 
   * Şikayet istatistiklerini getirir.
   * 
   * @returns {Promise<ReportStatistics | null>}
   */
  static async getReportStatistics(): Promise<ReportStatistics | null> {
    try {
      // Toplam sayılar
      const [totalResult, pendingResult, reviewedResult, resolvedResult, dismissedResult] = await Promise.all([
        supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'reviewed'),
        supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
      ]);

      // Türe göre dağılım
      const { data: typeData } = await supabaseAdmin
        .from('reports')
        .select('reported_type');

      const reportsByType = typeData?.reduce((acc, report) => {
        const type = report.reported_type as keyof typeof acc;
        if (type in acc) {
          acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
      }, {
        news: 0,
        comment: 0,
        forum_post: 0,
        forum_topic: 0,
      }) || {
        news: 0,
        comment: 0,
        forum_post: 0,
        forum_topic: 0,
      };

      // Son şikayetler
      const { data: recentReports } = await supabaseAdmin
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(id, username, email, role),
          reviewer:users!reviewed_by(id, username, role)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        total_reports: totalResult.count || 0,
        pending_reports: pendingResult.count || 0,
        reviewed_reports: reviewedResult.count || 0,
        resolved_reports: resolvedResult.count || 0,
        dismissed_reports: dismissedResult.count || 0,
        reports_by_type: reportsByType,
        recent_reports: recentReports || [],
      };
    } catch (error) {
      console.error('Error in getReportStatistics:', error);
      return null;
    }
  }

  /**
   * Bulk Update Reports
   * 
   * Toplu şikayet güncelleme işlemi.
   * 
   * @param reportIds - Şikayet ID'leri
   * @param status - Yeni durum
   * @param reviewerId - İşlemi yapan moderatör ID'si
   * @returns {Promise<number>} Güncellenen kayıt sayısı
   */
  static async bulkUpdateReports(
    reportIds: string[],
    status: string,
    reviewerId: string
  ): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .update({
          status: status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', reportIds)
        .select('id');

      if (error) {
        console.error('Error in bulk update reports:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in bulkUpdateReports:', error);
      return 0;
    }
  }
} 