/**
 * Reports Feature Type Definitions
 * 
 * Reports modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve report yapıları.
 * 
 */

import { Report, User } from '@/core/types/database.types';

// ==================== REPORT REQUEST DTOs ====================

/**
 * Report Creation Request DTO
 * 
 * Yeni şikayet oluşturma için gerekli veriler.
 * Kullanıcılar tarafından kullanılır.
 */
export interface CreateReportRequest {
  reported_type: string;     // Şikayet türü (news, comment, forum_post, forum_topic)
  reported_id: string;       // Şikayet edilen içeriğin ID'si
  reason: string;            // Şikayet nedeni
  description?: string;      // Detaylı açıklama (opsiyonel)
}

/**
 * Report Review Request DTO
 * 
 * Şikayet değerlendirme için gerekli veriler.
 * Moderatörler tarafından kullanılır.
 */
export interface ReviewReportRequest {
  status: string;            // Yeni durum (reviewed, resolved, dismissed)
  review_notes?: string;     // Değerlendirme notları (opsiyonel)
}

/**
 * Bulk Report Action Request DTO
 * 
 * Toplu şikayet işlemi için gerekli veriler.
 */
export interface BulkReportActionRequest {
  report_ids: string[];      // İşlem yapılacak şikayet ID'leri
  action: string;            // İşlem türü (resolve, dismiss)
  review_notes?: string;     // Toplu işlem notları
}

// ==================== REPORT RESPONSE DTOs ====================

/**
 * Report with Details Interface
 * 
 * Şikayet bilgilerini kullanıcı ve içerik detaylarıyla birlikte içerir.
 */
export interface ReportWithDetails extends Report {
  reporter?: Pick<User, 'id' | 'username' | 'email' | 'role'>;
  reviewer?: Pick<User, 'id' | 'username' | 'role'>;
  reported_content?: {
    id: string;
    title?: string;
    content?: string;
    author?: Pick<User, 'id' | 'username' | 'role'>;
    created_at: string;
  };
}

/**
 * Report Statistics Interface
 * 
 * Şikayet istatistiklerini içerir.
 */
export interface ReportStatistics {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  reports_by_type: {
    news: number;
    comment: number;
    forum_post: number;
    forum_topic: number;
  };
  recent_reports: ReportWithDetails[];
}

/**
 * Bulk Action Result Interface
 * 
 * Toplu işlem sonucunu içerir.
 */
export interface BulkActionResult {
  total_processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    report_id: string;
    error: string;
  }>;
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic Report Service Response Interface
 * 
 * Tüm Report servis metodlarının standart dönüş tipi.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface ReportServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== CONTENT VALIDATION TYPES ====================

/**
 * Content Validation Result Interface
 * 
 * İçerik doğrulama sonucunu içerir.
 */
export interface ContentValidationResult {
  exists: boolean;           // İçerik var mı?
  content_type: string;      // İçerik türü
  content_id: string;        // İçerik ID'si
  author_id?: string;        // İçerik sahibi ID'si
  title?: string;            // İçerik başlığı
  is_active: boolean;        // İçerik aktif mi?
}

// ==================== REPORT FILTER TYPES ====================

/**
 * Report Filter Options Interface
 * 
 * Şikayet filtreleme seçenekleri.
 */
export interface ReportFilterOptions {
  status?: string;           // Durum filtresi
  reported_type?: string;    // Tür filtresi
  reporter_id?: string;      // Şikayet eden kullanıcı filtresi
  reviewer_id?: string;      // Değerlendiren moderatör filtresi
  date_from?: string;        // Başlangıç tarihi
  date_to?: string;          // Bitiş tarihi
  search?: string;           // Arama terimi
} 