/**
 * RSS Parser Utility
 * 
 * RSS feed'lerini parse etmek için yardımcı fonksiyonlar.
 * rss-parser kütüphanesini kullanarak RSS XML'ini JavaScript objesine çevirir.
 * 
 */

import Parser from 'rss-parser';
import { RssFeedResponse, RssFeedItem } from '@/features/rss/rss.types';
import { RSS_PARSER_CONFIG } from '@/features/rss/rss.constants';

/**
 * RSS Parser Class
 * 
 * Static metodlarla RSS feed parsing işlemlerini yönetir.
 */
export class RssParserUtil {
  private static parser = new Parser({
    timeout: RSS_PARSER_CONFIG.TIMEOUT,
    headers: {
      'User-Agent': RSS_PARSER_CONFIG.USER_AGENT,
      'Accept': RSS_PARSER_CONFIG.ACCEPT_HEADER,
    },
    customFields: {
      item: [
        ['dc:date', 'dcDate'],
        ['pubDate', 'pubDate'],
        ['published', 'published'],
        ['updated', 'updated'],
      ]
    }
  });

  /**
   * Parse RSS Feed
   * 
   * RSS feed URL'ini parse ederek haber öğelerini çıkarır.
   * 
   * @param url - RSS feed URL'i
   * @returns {Promise<RssFeedResponse>} Parse edilmiş RSS verisi
   */
  static async parseFeed(url: string): Promise<RssFeedResponse> {
    try {
      // URL'yi temizle ve validate et
      const cleanUrl = this.sanitizeUrl(url);
      
      // Önce XML içeriğini fetch et ve temizle
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': RSS_PARSER_CONFIG.USER_AGENT,
          'Accept': RSS_PARSER_CONFIG.ACCEPT_HEADER,
        },
        signal: AbortSignal.timeout(RSS_PARSER_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let xmlContent = await response.text();
      
      // XML içeriğini temizle
      xmlContent = this.sanitizeXmlContent(xmlContent);
      
      // Parse işlemi
      const feed = await this.parser.parseString(xmlContent);

      // RSS feed meta bilgilerini çıkar
      const feedResponse: RssFeedResponse = {
        title: feed.title || 'Bilinmeyen Feed',
        description: feed.description,
        link: feed.link,
        lastBuildDate: feed.lastBuildDate,
        items: [],
      };

      // Her RSS item'ını standart formata çevir
      if (feed.items && feed.items.length > 0) {
        feedResponse.items = feed.items.map(item => this.parseRssItem(item));
      }

      return feedResponse;
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      
      // Fallback: Direkt URL parse dene
      try {
        console.log('Trying fallback URL parsing...');
        const feed = await this.parser.parseURL(url);
        
        const feedResponse: RssFeedResponse = {
          title: feed.title || 'Bilinmeyen Feed',
          description: feed.description,
          link: feed.link,
          lastBuildDate: feed.lastBuildDate,
          items: feed.items ? feed.items.map(item => this.parseRssItem(item)) : [],
        };
        
        return feedResponse;
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        throw new Error(`RSS feed parse edilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    }
  }

  /**
   * Parse RSS Item
   * 
   * Tek bir RSS item'ını standart formata çevirir.
   * 
   * @param item - Raw RSS item
   * @returns {RssFeedItem} Standart format RSS item
   * @private
   */
  private static parseRssItem(item: any): RssFeedItem {
    // Tarih parsing - birden fazla kaynak dene
    const pubDate = this.parseItemDate(item);
    
    return {
      title: this.cleanText(item.title || 'Başlıksız'),
      link: item.link || '',
      description: this.cleanText(item.contentSnippet || item.content || item.description || ''),
      pubDate: pubDate,
      author: this.cleanText(item.creator || item.author || ''),
      guid: item.guid || item.id || item.link,
      enclosure: item.enclosure ? {
        url: item.enclosure.url,
        type: item.enclosure.type,
        length: item.enclosure.length,
      } : undefined,
    };
  }

  /**
   * Parse Item Date
   * 
   * RSS item'ından tarihi çıkarır, Türkçe formatları da destekler.
   * 
   * @param item - RSS item
   * @returns {string} ISO format tarih
   * @private
   */
  private static parseItemDate(item: any): string {
    const dateFields = [
      item.pubDate,
      item.isoDate,
      item.dcDate,
      item.published,
      item.updated,
      item.date
    ];

    for (const dateField of dateFields) {
      if (dateField) {
        const parsedDate = this.parseTurkishDate(dateField);
        if (parsedDate) {
          return parsedDate;
        }
      }
    }

    // Hiçbir tarih bulunamazsa şu anki zamanı kullan
    return new Date().toISOString();
  }

  /**
   * Parse Turkish Date
   * 
   * Türkçe tarih formatlarını parse eder.
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

      // Türkçe formatları parse et
      const turkishPatterns = [
        // "Son Güncelleme : 15.06.2025 - 17:00"
        /Son Güncelleme\s*:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*-\s*(\d{1,2}):(\d{2})/i,
        // "15.06.2025 - 17:00"
        /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*-\s*(\d{1,2}):(\d{2})/,
        // "15.06.2025 17:00"
        /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/,
        // "15.06.2025"
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      ];

      for (const pattern of turkishPatterns) {
        const match = dateString.match(pattern);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          const hour = match[4] ? parseInt(match[4], 10) : 0;
          const minute = match[5] ? parseInt(match[5], 10) : 0;

          // Geçerli tarih kontrolü
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day, hour, minute);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        }
      }

      // Diğer Türkçe formatları
      const cleanedDate = dateString
        .replace(/Son Güncelleme\s*:\s*/i, '')
        .replace(/Tarih\s*:\s*/i, '')
        .replace(/\s*-\s*/, ' ')
        .trim();

      const fallbackDate = new Date(cleanedDate);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }

    } catch (error) {
      console.warn('Date parsing error:', error);
    }

    return null;
  }

  /**
   * Sanitize URL
   * 
   * URL'yi temizler ve güvenli hale getirir.
   * 
   * @param url - Temizlenecek URL
   * @returns {string} Temizlenmiş URL
   * @private
   */
  private static sanitizeUrl(url: string): string {
    return url.trim().replace(/\s+/g, '');
  }

  /**
   * Clean Text
   * 
   * HTML tag'lerini temizler ve metni düzenler.
   * 
   * @param text - Temizlenecek metin
   * @returns {string} Temizlenmiş metin
   * @private
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // HTML tag'lerini kaldır
      .replace(/&nbsp;/g, ' ') // Non-breaking space'leri düzenle
      .replace(/&amp;/g, '&')  // HTML entity'lerini düzenle
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')     // Çoklu boşlukları tek boşluğa çevir
      .trim();                  // Başındaki ve sonundaki boşlukları kaldır
  }

  /**
   * Validate RSS URL
   * 
   * URL'in geçerli bir RSS feed olup olmadığını kontrol eder.
   * 
   * @param url - Kontrol edilecek URL
   * @returns {Promise<boolean>} RSS feed geçerli mi?
   */
  static async validateRssUrl(url: string): Promise<boolean> {
    try {
      const feed = await this.parser.parseURL(url);
      return !!(feed && feed.items && feed.items.length > 0);
    } catch (error) {
      console.error('RSS validation error:', error);
      return false;
    }
  }

  /**
   * Sanitize XML Content
   * 
   * XML içeriğini temizler ve geçersiz karakterleri düzeltir.
   * 
   * @param xmlContent - XML içeriği
   * @returns {string} Temizlenmiş XML
   * @private
   */
  private static sanitizeXmlContent(xmlContent: string): string {
    return xmlContent
      // BOM karakterini kaldır
      .replace(/^\uFEFF/, '')
      // Geçersiz XML karakterleri kaldır
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Çift encoding sorunlarını düzelt
      .replace(/&amp;amp;/g, '&amp;')
      .replace(/&amp;lt;/g, '&lt;')
      .replace(/&amp;gt;/g, '&gt;')
      .replace(/&amp;quot;/g, '&quot;')
      .replace(/&amp;apos;/g, '&apos;')
      // Geçersiz entity referanslarını düzelt
      .replace(/&([^;]{20,})/g, '&amp;$1')
      // Kapatılmamış CDATA bölümlerini düzelt
      .replace(/<!\[CDATA\[([^\]]*)\]\]>/g, (match, content) => {
        return `<![CDATA[${content.replace(/\]\]>/g, ']]&gt;')}]]>`;
      })
      // Encoding sorunlarını düzelt
      .replace(/encoding="[^"]*"/i, 'encoding="UTF-8"');
  }
} 