import { parseStringPromise } from "xml2js";

export interface ParsedFeed {
  title: string;
  description: string;
  link: string;
  items: ParsedArticle[];
}

export interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  author?: string;
  publishedAt?: Date;
  guid: string;
  content?: string;
}

export class RSSParser {
  static async parseFeed(url: string): Promise<ParsedFeed> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SUPRSS RSS Reader 1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const result = await parseStringPromise(xml);

      // Handle RSS 2.0 format
      if (result.rss && result.rss.channel) {
        return this.parseRSS2(result.rss.channel[0]);
      }

      // Handle Atom format
      if (result.feed) {
        return this.parseAtom(result.feed);
      }

      throw new Error('Unsupported feed format');
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      throw error;
    }
  }

  private static parseRSS2(channel: any): ParsedFeed {
    const items = (channel.item || []).map((item: any) => ({
      title: this.extractText(item.title),
      link: this.extractText(item.link),
      description: this.extractText(item.description),
      author: this.extractText(item.author) || this.extractText(item['dc:creator']),
      publishedAt: this.parseDate(item.pubDate),
      guid: this.extractText(item.guid) || this.extractText(item.link),
      content: this.extractText(item['content:encoded']) || this.extractText(item.description),
    }));

    return {
      title: this.extractText(channel.title),
      description: this.extractText(channel.description),
      link: this.extractText(channel.link),
      items,
    };
  }

  private static parseAtom(feed: any): ParsedFeed {
    const items = (feed.entry || []).map((entry: any) => ({
      title: this.extractText(entry.title),
      link: entry.link?.[0]?.$.href || '',
      description: this.extractText(entry.summary) || this.extractText(entry.content),
      author: entry.author?.[0]?.name?.[0] || '',
      publishedAt: this.parseDate(entry.published) || this.parseDate(entry.updated),
      guid: this.extractText(entry.id),
      content: this.extractText(entry.content) || this.extractText(entry.summary),
    }));

    return {
      title: this.extractText(feed.title),
      description: this.extractText(feed.subtitle),
      link: feed.link?.[0]?.$.href || '',
      items,
    };
  }

  private static extractText(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field) && field.length > 0) {
      const item = field[0];
      if (typeof item === 'string') return item;
      if (item._) return item._;
      if (typeof item === 'object' && item.$text) return item.$text;
    }
    return '';
  }

  private static parseDate(dateStr: any): Date | undefined {
    if (!dateStr) return undefined;
    const text = this.extractText(dateStr);
    if (!text) return undefined;
    
    const date = new Date(text);
    return isNaN(date.getTime()) ? undefined : date;
  }

  static async validateFeedUrl(url: string): Promise<boolean> {
    try {
      await this.parseFeed(url);
      return true;
    } catch {
      return false;
    }
  }
}
