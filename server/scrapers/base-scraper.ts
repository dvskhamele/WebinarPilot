import { Webinar } from '@shared/types';

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  enabled: boolean;
  rateLimit?: number; // milliseconds between requests
}

export interface ScrapedWebinar {
  title: string;
  description: string;
  host: string;
  dateTime: Date;
  duration: number;
  category: string;
  tags: string[];
  isLive: boolean;
  isFree: boolean;
  maxAttendees?: number;
  registrationUrl: string;
  meetingUrl?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourcePlatform: string;
}

export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  abstract scrapeWebinars(): Promise<ScrapedWebinar[]>;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected generateWebinarId(title: string, host: string): string {
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const cleanHost = host.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    
    return `${cleanHost}-${cleanTitle}`;
  }

  protected convertToWebinar(scraped: ScrapedWebinar): Omit<Webinar, 'createdAt' | 'updatedAt'> {
    return {
      id: this.generateWebinarId(scraped.title, scraped.host),
      title: scraped.title,
      description: scraped.description,
      host: scraped.host,
      dateTime: scraped.dateTime,
      duration: scraped.duration,
      category: scraped.category,
      tags: scraped.tags,
      isLive: scraped.isLive,
      isFree: scraped.isFree,
      maxAttendees: scraped.maxAttendees,
      registrationUrl: scraped.registrationUrl,
      meetingUrl: scraped.meetingUrl,
      imageUrl: scraped.imageUrl,
    };
  }

  protected isValidWebinar(webinar: ScrapedWebinar): boolean {
    return !!(
      webinar.title &&
      webinar.host &&
      webinar.dateTime &&
      webinar.registrationUrl &&
      webinar.dateTime > new Date() // Only future webinars
    );
  }

  async scrapeAndValidate(): Promise<Omit<Webinar, 'createdAt' | 'updatedAt'>[]> {
    try {
      console.log(`Starting scrape for ${this.config.name}...`);
      const scraped = await this.scrapeWebinars();
      
      const validWebinars = scraped
        .filter(this.isValidWebinar)
        .map(this.convertToWebinar.bind(this));
      
      console.log(`${this.config.name}: Found ${scraped.length} webinars, ${validWebinars.length} valid`);
      return validWebinars;
    } catch (error) {
      console.error(`Error scraping ${this.config.name}:`, error);
      return [];
    }
  }
}