/**
 * Reports Feature Business Logic Layer
 * 
 * Report işlemlerinin tüm iş mantığını içerir.
 * Şikayet yönetimi, içerik doğrulama ve moderasyon işlemleri.
 * 
 */

import { ReportsModel } from './reports.model';
import { 
  CreateReportInput, 
  ReviewReportInput, 
  ReportQueryInput,
  BulkReportActionInput 
} from './reports.validation';
import { 
  ReportServiceResponse,
  ReportWithDetails,
  ReportStatistics,
  BulkActionResult,
} from './reports.types';
import { 
  REPORT_ERROR_MESSAGES,
  REPORT_SUCCESS_MESSAGES,
  REPORT_PERMISSIONS,
} from './reports.constants';
import { Report } from '@/core/types/database.types';

/**
 * Reports Service Class
 * 
 * Static metodlarla Report iş mantığını yönetir.
 * Model katmanını kullanarak veritabanı işlemlerini soyutlar.
 */
export class ReportsService {
  
  // ==================== REPORT MANAGEMENT ====================
  
  /**
   * Create Report Business Logic
   * 
   * Yeni şikayet oluşturma için tüm iş mantığını yönetir:
   * - İçerik varlık kontrolü
   * - Kendi içeriğini şikayet etme kontrolü
   * - Duplicate şikayet kontrolü
   * - Veritabanına kaydetme
   * 
   * @param reportData - Validasyon geçmiş şikayet verisi
   * @param reporterId - Şikayet eden kullanıcı ID'si
   * @returns {Promise<ReportServiceResponse<Report>>}
   */
  static async createReport(
    reportData: CreateReportInput,
    reporterId: string
  ): Promise<ReportServiceResponse<Report>> {
    try {
      // İçerik varlık ve geçerlilik kontrolü
      const contentValidation = await ReportsModel.validateReportedContent(
        reportData.reported_type,
        reportData.reported_id
      );

      if (!contentValidation.exists) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.CONTENT_NOT_FOUND,
        };
      }

      if (!contentValidation.is_active) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.CONTENT_NOT_FOUND,
        };
      }

      // Kendi içeriğini şikayet etme kontrolü (news için geçerli değil çünkü AI tarafından oluşturuluyor)
      if (contentValidation.author_id && contentValidation.author_id === reporterId) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.SELF_REPORT_NOT_ALLOWED,
        };
      }

      // Duplicate şikayet kontrolü
      const isDuplicate = await ReportsModel.checkDuplicateReport(
        reporterId,
        reportData.reported_type,
        reportData.reported_id
      );

      if (isDuplicate) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.DUPLICATE_REPORT,
        };
      }

      // Şikayeti oluştur
      const report = await ReportsModel.createReport(reportData, reporterId);

      if (!report) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_CREATE_FAILED,
        };
      }

      return {
        success: true,
        data: report,
        message: REPORT_SUCCESS_MESSAGES.REPORT_CREATED,
      };
    } catch (error) {
      console.error('Error in createReport service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Reports with Pagination
   * 
   * Şikayetleri sayfalama ve filtreleme ile getirme işlemi.
   * 
   * @param queryParams - Filtreleme ve sayfalama parametreleri
   * @returns {Promise<ReportServiceResponse<{reports: ReportWithDetails[], total: number, page: number, limit: number}>>}
   */
  static async getReports(
    queryParams: ReportQueryInput
  ): Promise<ReportServiceResponse<{
    reports: ReportWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const result = await ReportsModel.getReports(queryParams);

      if (!result) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_FETCH_FAILED,
        };
      }

      const totalPages = Math.ceil(result.total / queryParams.limit);

      return {
        success: true,
        data: {
          reports: result.reports,
          total: result.total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getReports service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Get Report by ID
   * 
   * ID'ye göre şikayeti getirme işlemi.
   * 
   * @param id - Şikayet ID'si
   * @returns {Promise<ReportServiceResponse<ReportWithDetails>>}
   */
  static async getReportById(id: string): Promise<ReportServiceResponse<ReportWithDetails>> {
    try {
      const report = await ReportsModel.getReportById(id);

      if (!report) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND,
        };
      }

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error('Error in getReportById service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Review Report
   * 
   * Şikayet değerlendirme işlemi.
   * 
   * @param id - Şikayet ID'si
   * @param reviewData - Değerlendirme verisi
   * @param reviewerId - Değerlendiren moderatör ID'si
   * @param reviewerRole - Değerlendiren kullanıcının rolü
   * @returns {Promise<ReportServiceResponse<Report>>}
   */
  static async reviewReport(
    id: string,
    reviewData: ReviewReportInput,
    reviewerId: string,
    reviewerRole: string
  ): Promise<ReportServiceResponse<Report>> {
    try {
      // Yetki kontrolü
      if (!REPORT_PERMISSIONS.REVIEW.includes(reviewerRole)) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REVIEW_PERMISSION_REQUIRED,
        };
      }

      // Mevcut şikayetin varlığını kontrol et
      const existingReport = await ReportsModel.getReportById(id);
      if (!existingReport) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND,
        };
      }

      // Şikayeti değerlendir
      const reviewedReport = await ReportsModel.reviewReport(id, reviewData, reviewerId);

      if (!reviewedReport) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_REVIEW_FAILED,
        };
      }

      const successMessage = reviewData.status === 'resolved' 
        ? REPORT_SUCCESS_MESSAGES.REPORT_RESOLVED
        : reviewData.status === 'dismissed'
        ? REPORT_SUCCESS_MESSAGES.REPORT_DISMISSED
        : REPORT_SUCCESS_MESSAGES.REPORT_REVIEWED;

      return {
        success: true,
        data: reviewedReport,
        message: successMessage,
      };
    } catch (error) {
      console.error('Error in reviewReport service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  /**
   * Delete Report
   * 
   * Şikayet silme işlemi.
   * 
   * @param id - Şikayet ID'si
   * @param userRole - Silme işlemini yapan kullanıcının rolü
   * @returns {Promise<ReportServiceResponse<void>>}
   */
  static async deleteReport(
    id: string,
    userRole: string
  ): Promise<ReportServiceResponse<void>> {
    try {
      // Yetki kontrolü
      if (!['admin'].includes(userRole)) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        };
      }

      // Mevcut şikayetin varlığını kontrol et
      const existingReport = await ReportsModel.getReportById(id);
      if (!existingReport) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND,
        };
      }

      // Şikayeti sil
      const deleted = await ReportsModel.deleteReport(id);

      if (!deleted) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REPORT_DELETE_FAILED,
        };
      }

      return {
        success: true,
        message: 'Şikayet başarıyla silindi',
      };
    } catch (error) {
      console.error('Error in deleteReport service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk Report Action
   * 
   * Toplu şikayet işlemi.
   * 
   * @param actionData - Toplu işlem verisi
   * @param reviewerId - İşlemi yapan moderatör ID'si
   * @param reviewerRole - İşlemi yapan kullanıcının rolü
   * @returns {Promise<ReportServiceResponse<BulkActionResult>>}
   */
  static async bulkReportAction(
    actionData: BulkReportActionInput,
    reviewerId: string,
    reviewerRole: string
  ): Promise<ReportServiceResponse<BulkActionResult>> {
    try {
      // Yetki kontrolü
      if (!REPORT_PERMISSIONS.REVIEW.includes(reviewerRole)) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.REVIEW_PERMISSION_REQUIRED,
        };
      }

      const totalProcessed = actionData.report_ids.length;
      let successful = 0;
      const errors: Array<{ report_id: string; error: string }> = [];

      // Her şikayeti tek tek işle
      for (const reportId of actionData.report_ids) {
        try {
          const result = await ReportsModel.reviewReport(
            reportId,
            { status: actionData.action },
            reviewerId
          );

          if (result) {
            successful++;
          } else {
            errors.push({
              report_id: reportId,
              error: 'Güncelleme başarısız',
            });
          }
        } catch (error) {
          errors.push({
            report_id: reportId,
            error: 'İşlem hatası',
          });
        }
      }

      const failed = totalProcessed - successful;

      return {
        success: true,
        data: {
          total_processed: totalProcessed,
          successful,
          failed,
          errors,
        },
        message: REPORT_SUCCESS_MESSAGES.BULK_ACTION_COMPLETED,
      };
    } catch (error) {
      console.error('Error in bulkReportAction service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get Report Statistics
   * 
   * Şikayet istatistiklerini getirme işlemi.
   * 
   * @param userRole - İstatistikleri isteyen kullanıcının rolü
   * @returns {Promise<ReportServiceResponse<ReportStatistics>>}
   */
  static async getReportStatistics(
    userRole: string
  ): Promise<ReportServiceResponse<ReportStatistics>> {
    try {
      // Yetki kontrolü
      if (!REPORT_PERMISSIONS.VIEW_ALL.includes(userRole)) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        };
      }

      const statistics = await ReportsModel.getReportStatistics();

      if (!statistics) {
        return {
          success: false,
          error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
        };
      }

      return {
        success: true,
        data: statistics,
      };
    } catch (error) {
      console.error('Error in getReportStatistics service:', error);
      return {
        success: false,
        error: REPORT_ERROR_MESSAGES.OPERATION_FAILED,
      };
    }
  }
} 