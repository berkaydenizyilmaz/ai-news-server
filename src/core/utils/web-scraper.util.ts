/**
 * Web Scraper Utility
 * 
 * Türk haber sitelerinden dinamik content extraction.
 * Akıllı algoritma ile farklı site yapılarını otomatik tespit eder.
 * 
 */

import * as cheerio from 'cheerio';
import { ScrapedNewsContent, ScrapingResult } from '@/features/rss/rss.types';
import { WEB_SCRAPING_CONFIG } from '@/core/constants';

/**
 * Web Scraper Class
 * 
 * Türk haber siteleri için optimize edilmiş dinamik scraping.
 */
export class WebScraperUtil {
  
  /**
   * Scrape News Content
   * 
   * Verilen URL'den haber içeriğini çeker.
   * 
   * @param url - Scraping yapılacak URL
   * @param timeout - Timeout süresi (ms)
   * @returns {Promise<ScrapingResult>} Scraping sonucu
   */
  static async scrapeNewsContent(url: string, timeout: number = WEB_SCRAPING_CONFIG.DEFAULT_TIMEOUT): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Scraping başlatılıyor: ${url}`);
      
      // HTTP isteği gönder
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        return {
          url,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
          scrape_time: Date.now() - startTime,
        };
      }

      const html = await response.text();
      console.log(`📄 HTML alındı: ${Math.round(html.length / 1024)}KB`);
      
      const content = this.parseHtmlContent(html, url);

      console.log(`✅ Content extraction tamamlandı: "${content.title?.substring(0, 50)}..."`);

      return {
        url,
        success: true,
        content,
        status_code: response.status,
        scrape_time: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`❌ Scraping error for ${url}:`, error);
      
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen scraping hatası',
        scrape_time: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse HTML Content
   * 
   * HTML içeriğini akıllı algoritma ile parse eder.
   * 
   * @param html - HTML içeriği
   * @param url - Kaynak URL
   * @returns {ScrapedNewsContent} Parse edilmiş içerik
   * @private
   */
  private static parseHtmlContent(html: string, url: string): ScrapedNewsContent {
    const $ = cheerio.load(html);

    return {
      title: this.extractTitle($) || 'Başlık bulunamadı',
      content: this.extractContent($) || 'İçerik çıkarılamadı',
      summary: this.extractSummary($),
      author: this.extractAuthor($),
      published_date: this.extractPublishedDate($),
      image_url: this.extractImageUrl($, url),
      scrape_time: Date.now(),
    };
  }

  /**
   * Extract Title - Akıllı Başlık Çıkarma
   * 
   * @param $ - Cheerio instance
   * @returns {string} Başlık
   * @private
   */
  private static extractTitle($: any): string {
    // Önce meta tag'leri kontrol et
    let title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('meta[name="title"]').attr('content');
    
    if (title && title.trim().length > 10) {
      return this.cleanText(title.trim());
    }

    // H1 tag'lerini akıllıca bul
    const h1Elements = $('h1');
    let bestTitle = '';
    let bestScore = 0;

    h1Elements.each((i: number, element: any) => {
      const text = $(element).text().trim();
      if (!text || text.length < 10) return;

      let score = 0;
      
      // Uzunluk skoru (çok kısa veya çok uzun başlıkları cezalandır)
      if (text.length >= 20 && text.length <= 150) score += 10;
      else if (text.length >= 10 && text.length <= 200) score += 5;
      
      // Konum skoru (sayfanın üst kısmındaki başlıklar daha değerli)
      const position = $(element).offset()?.top || 0;
      if (position < 1000) score += 5;
      
      // Class/ID skoru (haber başlığı olabilecek class'lar)
      const className = $(element).attr('class') || '';
      const id = $(element).attr('id') || '';
      const combined = (className + ' ' + id).toLowerCase();
      
      if (combined.includes('title') || combined.includes('baslik') || 
          combined.includes('headline') || combined.includes('haber')) {
        score += 15;
      }
      
      // Parent element skoru
      const parent = $(element).parent();
      const parentClass = parent.attr('class') || '';
      if (parentClass.toLowerCase().includes('header') || 
          parentClass.toLowerCase().includes('title') ||
          parentClass.toLowerCase().includes('content')) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTitle = text;
      }
    });

    if (bestTitle) {
      return this.cleanText(bestTitle);
    }

    // Fallback: title tag'ından al ve temizle
    const pageTitle = $('title').text();
    if (pageTitle) {
      return this.cleanText(pageTitle.split(' - ')[0].split(' | ')[0]);
    }

    return '';
  }

  /**
   * Extract Content - Akıllı İçerik Çıkarma
   * 
   * @param $ - Cheerio instance
   * @returns {string} İçerik
   * @private
   */
  private static extractContent($: any): string {
    // Gereksiz elementleri kaldır
    $('script, style, nav, aside, footer, header, .advertisement, .ads, .ad, .social-share, .share, .related, .comments, .comment, .sidebar, .navigation, .breadcrumb, .tags, .categories, .author-box, .bio, .newsletter, .subscription, [class*="ad"], [id*="ad"], [class*="banner"], .widget, .popup, .modal, .overlay').remove();

    // Potansiyel content container'ları bul
    const contentCandidates: Array<{element: any, score: number, text: string}> = [];

    $('div, article, section, main').each((i: number, element: any) => {
      const $element = $(element);
      const text = $element.text().trim();
      
      // Çok kısa içerikleri atla
      if (text.length < 200) return;
      
      let score = 0;
      
      // Uzunluk skoru
      if (text.length > 500) score += 10;
      if (text.length > 1000) score += 10;
      if (text.length > 2000) score += 5;
      
      // Class/ID skoru
      const className = $element.attr('class') || '';
      const id = $element.attr('id') || '';
      const combined = (className + ' ' + id).toLowerCase();
      
      if (combined.includes('content') || combined.includes('article') || 
          combined.includes('post') || combined.includes('entry') ||
          combined.includes('text') || combined.includes('body') ||
          combined.includes('haber') || combined.includes('detay')) {
        score += 20;
      }
      
      // Paragraf yoğunluğu skoru
      const paragraphs = $element.find('p');
      if (paragraphs.length > 3) score += 10;
      if (paragraphs.length > 5) score += 5;
      
      // Alt element kontrolü (çok fazla alt div varsa reklam olabilir)
      const childDivs = $element.find('div').length;
      const textLength = text.length;
      if (childDivs > 0 && (childDivs / textLength * 1000) > 5) {
        score -= 10; // Çok fazla div var, muhtemelen reklam
      }
      
      // Link yoğunluğu kontrolü
      const links = $element.find('a').length;
      if (links > 0 && (links / textLength * 1000) > 3) {
        score -= 5; // Çok fazla link var
      }

      contentCandidates.push({
        element: $element,
        score: score,
        text: text
      });
    });

    // En yüksek skorlu content'i seç
    contentCandidates.sort((a, b) => b.score - a.score);
    
    if (contentCandidates.length > 0) {
      const bestCandidate = contentCandidates[0];
      console.log(`📝 En iyi content bulundu: ${bestCandidate.score} puan, ${bestCandidate.text.length} karakter`);
      
      return this.extractTextFromElement(bestCandidate.element, $);
    }

    return '';
  }

  /**
   * Extract Text From Element
   * 
   * Element'ten temiz metin çıkarır.
   * 
   * @param element - İçerik elementi
   * @param $ - Cheerio instance
   * @returns {string} Temizlenmiş metin
   * @private
   */
  private static extractTextFromElement(element: any, $: any): string {
    const paragraphs: string[] = [];
    
    // Önce paragrafları al
    element.find('p').each((i: number, p: any) => {
      const text = $(p).text().trim();
      if (text && text.length > 20) {
        paragraphs.push(text);
      }
    });

    // Paragraf yoksa div'leri dene
    if (paragraphs.length === 0) {
      element.find('div').each((i: number, div: any) => {
        const text = $(div).text().trim();
        // Alt div'i olmayan ve yeterince uzun olan div'leri al
        if (text && text.length > 50 && $(div).find('div').length === 0) {
          paragraphs.push(text);
        }
      });
    }

    // Hala içerik yoksa tüm metni al
    if (paragraphs.length === 0) {
      const allText = element.text().trim();
      return this.cleanText(allText);
    }

    return paragraphs.map(p => this.cleanText(p)).join('\n\n');
  }

  /**
   * Extract Summary
   * 
   * @param $ - Cheerio instance
   * @returns {string} Özet
   * @private
   */
  private static extractSummary($: any): string {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="og:description"]').attr('content') ||
           $('meta[name="twitter:description"]').attr('content') ||
           '';
  }

  /**
   * Extract Author
   * 
   * @param $ - Cheerio instance
   * @returns {string} Yazar
   * @private
   */
  private static extractAuthor($: any): string {
    return $('meta[name="author"]').attr('content') ||
           $('meta[property="article:author"]').attr('content') ||
           $('.author, .byline, .post-author, .article-author, .writer').first().text().trim() ||
           '';
  }

  /**
   * Extract Published Date
   * 
   * @param $ - Cheerio instance
   * @returns {string} Yayın tarihi
   * @private
   */
  private static extractPublishedDate($: any): string {
    let date = $('meta[property="article:published_time"]').attr('content') ||
               $('meta[name="publish_date"]').attr('content') ||
               $('time[datetime]').attr('datetime') ||
               $('time').first().text().trim() ||
               $('.publish-date, .post-date, .article-date').first().text().trim();

    if (date) {
      const parsedDate = this.parseTurkishDate(date);
      return parsedDate || date;
    }

    return '';
  }

  /**
   * Extract Image URL
   * 
   * @param $ - Cheerio instance
   * @param baseUrl - Base URL
   * @returns {string} Resim URL'i
   * @private
   */
  private static extractImageUrl($: any, baseUrl: string): string {
    let imageUrl = $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') ||
                   $('.featured-image img, .post-thumbnail img, .article-image img, .hero-image img, .main-image img').first().attr('src') ||
                   $('article img, .content img').first().attr('src');

    if (imageUrl) {
      return this.normalizeImageUrl(imageUrl, baseUrl);
    }

    return '';
  }

  /**
   * Normalize Image URL
   * 
   * @param imageUrl - Resim URL'i
   * @param baseUrl - Base URL
   * @returns {string} Normalize edilmiş URL
   * @private
   */
  private static normalizeImageUrl(imageUrl: string, baseUrl: string): string {
    if (!imageUrl) return '';
    
    try {
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        return new URL(imageUrl, baseUrl).href;
      }
      return imageUrl;
    } catch (error) {
      return imageUrl;
    }
  }

  /**
   * Parse Turkish Date
   * 
   * Türkçe tarih formatlarını ISO formatına çevirir.
   * 
   * @param dateString - Tarih string'i
   * @returns {string|null} ISO format tarih veya null
   * @private
   */
  private static parseTurkishDate(dateString: string): string | null {
    if (!dateString) return null;

    try {
      // Önce standart Date parse'ı dene
      const standardDate = new Date(dateString);
      if (!isNaN(standardDate.getTime())) {
        return standardDate.toISOString();
      }

      // Türkçe formatları
      const patterns = [
        /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*-?\s*(\d{1,2}):(\d{2})/,
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
        /(\d{1,2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})/i,
      ];

      const months: {[key: string]: number} = {
        'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
        'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
      };

      for (const pattern of patterns) {
        const match = dateString.match(pattern);
        if (match) {
          if (pattern.source.includes('Ocak')) {
            // Türkçe ay isimleri
            const day = parseInt(match[1], 10);
            const monthName = match[2].toLowerCase();
            const year = parseInt(match[3], 10);
            const month = months[monthName];
            
            if (month !== undefined) {
              return new Date(year, month, day).toISOString();
            }
          } else {
            // Sayısal formatlar
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            const hour = match[4] ? parseInt(match[4], 10) : 0;
            const minute = match[5] ? parseInt(match[5], 10) : 0;

            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return new Date(year, month - 1, day, hour, minute).toISOString();
            }
          }
        }
      }
    } catch (error) {
      console.warn('Date parsing error:', error);
    }

    return null;
  }

  /**
   * Clean Text
   * 
   * @param text - Temizlenecek metin
   * @returns {string} Temizlenmiş metin
   * @private
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .replace(/\t+/g, ' ')
      .trim();
  }
} 