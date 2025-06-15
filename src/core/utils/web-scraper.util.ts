/**
 * Web Scraper Utility
 * 
 * Web sayfalarından haber içeriği çekmek için yardımcı fonksiyonlar.
 * Cheerio kullanarak hafif scraping, gerekirse Puppeteer ile dinamik içerik.
 * 
 */

import * as cheerio from 'cheerio';
import { ScrapedNewsContent, ScrapingResult } from '@/features/rss/rss.types';
import { WEB_SCRAPING_CONFIG } from '@/core/constants';

/**
 * Web Scraper Class
 * 
 * Static metodlarla web scraping işlemlerini yönetir.
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
      // HTTP isteği gönder
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': WEB_SCRAPING_CONFIG.USER_AGENT,
          'Accept': WEB_SCRAPING_CONFIG.ACCEPT_HEADER,
          'Accept-Language': WEB_SCRAPING_CONFIG.ACCEPT_LANGUAGE,
          'Accept-Encoding': WEB_SCRAPING_CONFIG.ACCEPT_ENCODING,
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
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
      const content = this.parseHtmlContent(html, url);

      return {
        url,
        success: true,
        content,
        status_code: response.status,
        scrape_time: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`Scraping error for ${url}:`, error);
      
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
   * HTML içeriğini parse ederek haber verilerini çıkarır.
   * 
   * @param html - HTML içeriği
   * @param url - Kaynak URL
   * @returns {ScrapedNewsContent} Parse edilmiş içerik
   * @private
   */
  private static parseHtmlContent(html: string, url: string): ScrapedNewsContent {
    const $ = cheerio.load(html) as cheerio.CheerioAPI;
    const scrapeTime = Date.now();

    // Başlık çıkarma stratejileri
    const title = this.extractTitle($);
    
    // İçerik çıkarma stratejileri
    const content = this.extractContent($);
    
    // Özet çıkarma
    const summary = this.extractSummary($);
    
    // Yazar çıkarma
    const author = this.extractAuthor($);
    
    // Yayın tarihi çıkarma
    const publishedDate = this.extractPublishedDate($);
    
    // Ana resim çıkarma
    const imageUrl = this.extractImageUrl($, url);

    return {
      title: title || 'Başlık bulunamadı',
      content: content || 'İçerik çıkarılamadı',
      summary,
      author,
      published_date: publishedDate,
      image_url: imageUrl,
      scrape_time: Date.now() - scrapeTime,
    };
  }

  /**
   * Extract Title
   * 
   * Sayfadan başlığı çıkarır.
   * 
   * @param $ - Cheerio instance
   * @returns {string} Başlık
   * @private
   */
  private static extractTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      'h1.entry-title',
      'h1.post-title',
      'h1.article-title',
      'h1[class*="title"]',
      '.entry-header h1',
      '.post-header h1',
      '.article-header h1',
      'h1',
      'title',
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > WEB_SCRAPING_CONFIG.MIN_TITLE_LENGTH) {
        return this.cleanText(title);
      }
    }

    return '';
  }

  /**
   * Extract Content
   * 
   * Sayfadan ana içeriği çıkarır.
   * 
   * @param $ - Cheerio instance
   * @returns {string} İçerik
   * @private
   */
  private static extractContent($: cheerio.CheerioAPI): string {
    const contentSelectors = [
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      '[class*="content"]',
      '.post-body',
      '.article-body',
      '.entry-body',
      'main article',
      'article',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Gereksiz elementleri kaldır
        element.find('script, style, nav, aside, footer, .advertisement, .ads, .social-share').remove();
        
        const content = element.text().trim();
        if (content && content.length > WEB_SCRAPING_CONFIG.MIN_CONTENT_LENGTH) {
          return this.cleanText(content);
        }
      }
    }

    return '';
  }

  /**
   * Extract Summary
   * 
   * Sayfadan özet çıkarır.
   * 
   * @param $ - Cheerio instance
   * @returns {string} Özet
   * @private
   */
  private static extractSummary($: cheerio.CheerioAPI): string {
    const summarySelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      '.excerpt',
      '.summary',
      '.lead',
    ];

    for (const selector of summarySelectors) {
      let summary = '';
      
      if (selector.startsWith('meta')) {
        summary = $(selector).attr('content') || '';
      } else {
        summary = $(selector).first().text().trim();
      }
      
      if (summary && summary.length > 20) {
        return this.cleanText(summary);
      }
    }

    return '';
  }

  /**
   * Extract Author
   * 
   * Sayfadan yazar bilgisini çıkarır.
   * 
   * @param $ - Cheerio instance
   * @returns {string} Yazar
   * @private
   */
  private static extractAuthor($: cheerio.CheerioAPI): string {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
      '.post-author',
      '.article-author',
      '[class*="author"]',
    ];

    for (const selector of authorSelectors) {
      let author = '';
      
      if (selector.startsWith('meta')) {
        author = $(selector).attr('content') || '';
      } else {
        author = $(selector).first().text().trim();
      }
      
      if (author && author.length > 2) {
        return this.cleanText(author);
      }
    }

    return '';
  }

  /**
   * Extract Published Date
   * 
   * Sayfadan yayın tarihini çıkarır.
   * 
   * @param $ - Cheerio instance
   * @returns {string} Yayın tarihi
   * @private
   */
  private static extractPublishedDate($: cheerio.CheerioAPI): string {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish_date"]',
      'time[datetime]',
      '.publish-date',
      '.post-date',
      '.article-date',
      '[class*="date"]',
    ];

    for (const selector of dateSelectors) {
      let date = '';
      
      if (selector.startsWith('meta')) {
        date = $(selector).attr('content') || '';
      } else if (selector === 'time[datetime]') {
        date = $(selector).attr('datetime') || $(selector).text().trim();
      } else {
        date = $(selector).first().text().trim();
      }
      
      if (date) {
        return date;
      }
    }

    return '';
  }

  /**
   * Extract Image URL
   * 
   * Sayfadan ana resim URL'ini çıkarır.
   * 
   * @param $ - Cheerio instance
   * @param baseUrl - Base URL
   * @returns {string} Resim URL'i
   * @private
   */
  private static extractImageUrl($: cheerio.CheerioAPI, baseUrl: string): string {
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.featured-image img',
      '.post-thumbnail img',
      '.article-image img',
      'article img',
      '.content img',
    ];

    for (const selector of imageSelectors) {
      let imageUrl = '';
      
      if (selector.startsWith('meta')) {
        imageUrl = $(selector).attr('content') || '';
      } else {
        imageUrl = $(selector).first().attr('src') || '';
      }
      
      if (imageUrl) {
        // Relative URL'leri absolute'a çevir
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = new URL(imageUrl, baseUrl).href;
        }
        
        return imageUrl;
      }
    }

    return '';
  }

  /**
   * Clean Text
   * 
   * Metni temizler ve düzenler.
   * 
   * @param text - Temizlenecek metin
   * @returns {string} Temizlenmiş metin
   * @private
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')     // Çoklu boşlukları tek boşluğa çevir
      .replace(/\n+/g, '\n')    // Çoklu satır sonlarını tek satır sonuna çevir
      .trim();                  // Başındaki ve sonundaki boşlukları kaldır
  }
} 