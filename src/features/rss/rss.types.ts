/**
 * RSS Feature Type Definitions
 * 
 * RSS modülü için tüm TypeScript tip tanımları.
 * Request/Response DTO'ları, servis tipleri ve RSS feed yapıları.
 * 
 */

import { RssSource, NewsCategory } from '@/core/types/database.types';

// ==================== RSS REQUEST DTOs ====================

/**
 * RSS Source Creation Request DTO
 * 
 * Yeni RSS kaynağı ekleme için gerekli veriler.
 * Admin tarafından kullanılır.
 */
export interface CreateRssSourceRequest {
  name: string;           // RSS kaynağının adı
  url: string;           // RSS feed URL'i
  description?: string;  // Açıklama (opsiyonel)
  category_id?: string;  // Haber kategorisi ID'si (opsiyonel)
}

/**
 * RSS Source Update Request DTO
 * 
 * Mevcut RSS kaynağını güncelleme için gerekli veriler.
 */
export interface UpdateRssSourceRequest {
  name?: string;         // RSS kaynağının adı
  url?: string;          // RSS feed URL'i
  description?: string;  // Açıklama
  category_id?: string;  // Haber kategorisi ID'si
  is_active?: boolean;   // Aktif/pasif durumu
}

/**
 * RSS Fetch Request DTO
 * 
 * RSS kaynaklarından haber çekme işlemi için parametreler.
 */
export interface RssFetchRequest {
  source_id?: string;    // Belirli bir kaynak (opsiyonel, yoksa tümü)
  max_items?: number;    // Maksimum haber sayısı
  force_refresh?: boolean; // Cache'i bypass et
}

// ==================== RSS RESPONSE DTOs ====================

/**
 * RSS Source with Category Response DTO
 * 
 * RSS kaynağını kategori bilgisiyle birlikte döner.
 */
export interface RssSourceWithCategory extends RssSource {
  category?: NewsCategory;
}

/**
 * RSS Feed Item Interface
 * 
 * RSS feed'den çekilen tek bir haber öğesi.
 */
export interface RssFeedItem {
  title: string;         // Haber başlığı
  link: string;          // Haber linki
  description?: string;  // Kısa açıklama/özet
  pubDate?: string;      // Yayın tarihi
  author?: string;       // Yazar
  guid?: string;         // Unique identifier
  enclosure?: {          // Medya dosyası (resim vb.)
    url: string;
    type: string;
    length?: string;
  };
}

/**
 * RSS Feed Response Interface
 * 
 * RSS feed'den çekilen tüm veriler.
 */
export interface RssFeedResponse {
  title: string;         // Feed başlığı
  description?: string;  // Feed açıklaması
  link?: string;         // Feed ana sayfası
  lastBuildDate?: string; // Son güncelleme tarihi
  items: RssFeedItem[];  // Haber öğeleri
}

/**
 * RSS Fetch Result Interface
 * 
 * RSS çekme işleminin sonucu.
 */
export interface RssFetchResult {
  source_id: string;     // RSS kaynak ID'si
  source_name: string;   // RSS kaynak adı
  success: boolean;      // İşlem başarılı mı?
  items_count: number;   // Çekilen haber sayısı
  new_items_count: number; // Yeni (duplicate olmayan) haber sayısı
  error?: string;        // Hata mesajı (varsa)
  fetch_time: number;    // Çekme süresi (ms)
}

/**
 * Bulk RSS Fetch Result Interface
 * 
 * Toplu RSS çekme işleminin sonucu.
 */
export interface BulkRssFetchResult {
  total_sources: number;     // Toplam kaynak sayısı
  successful_sources: number; // Başarılı kaynak sayısı
  failed_sources: number;    // Başarısız kaynak sayısı
  total_items: number;       // Toplam çekilen haber sayısı
  new_items: number;         // Yeni haber sayısı
  results: RssFetchResult[]; // Detaylı sonuçlar
  execution_time: number;    // Toplam çalışma süresi (ms)
}

// ==================== SERVICE RESPONSE TYPES ====================

/**
 * Generic RSS Service Response Interface
 * 
 * Tüm RSS servis metodlarının standart dönüş tipi.
 * 
 * @template T - Success durumunda dönen data'nın tipi
 */
export interface RssServiceResponse<T = any> {
  success: boolean;   // İşlem başarılı mı?
  data?: T;          // Başarılı durumda dönen data
  message?: string;  // Kullanıcıya gösterilecek mesaj
  error?: string;    // Hata durumunda hata mesajı
}

// ==================== SCRAPING TYPES ====================

/**
 * Scraped News Content Interface
 * 
 * Web scraping ile çekilen haber içeriği.
 */
export interface ScrapedNewsContent {
  title: string;         // Tam haber başlığı
  content: string;       // Tam haber metni
  summary?: string;      // Özet (meta description vb.)
  author?: string;       // Yazar
  published_date?: string; // Yayın tarihi
  image_url?: string;    // Ana resim URL'i
  scrape_time: number;   // Scraping süresi (ms)
}

/**
 * Scraping Result Interface
 * 
 * Web scraping işleminin sonucu.
 */
export interface ScrapingResult {
  url: string;           // Scraping yapılan URL
  success: boolean;      // İşlem başarılı mı?
  content?: ScrapedNewsContent; // Çekilen içerik
  error?: string;        // Hata mesajı (varsa)
  status_code?: number;  // HTTP status kodu
  scrape_time: number;   // Scraping süresi (ms)
} 