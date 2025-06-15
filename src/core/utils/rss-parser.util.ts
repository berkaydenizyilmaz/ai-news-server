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
      const feed = await this.parser.parseURL(url);

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
      throw new Error(`RSS feed parse edilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
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
    return {
      title: this.cleanText(item.title || 'Başlıksız'),
      link: item.link || '',
      description: this.cleanText(item.contentSnippet || item.content || item.description || ''),
      pubDate: item.pubDate || item.isoDate,
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
} 