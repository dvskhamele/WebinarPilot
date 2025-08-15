import { EventbriteScraper } from './eventbrite-scraper';
import { MeetupScraper } from './meetup-scraper';
import { DevpostScraper } from './devpost-scraper';
import { LumaScraper } from './luma-scraper';
import { WebinarNinjaScraper } from './webinarninja-scraper';
import { GoToWebinarScraper } from './gotowebinar-scraper';
import { ZoomWebinarScraper } from './zoom-webinar-scraper';
import { BaseScraper, ScrapedWebinar } from './base-scraper';
import { scraperAnalytics } from '../monitoring/scraper-analytics';
import crypto from 'crypto';
import { storage } from '../storage';
import { GeminiIntegration } from '../gemini-integration';

// ... (other imports and interfaces) ...

export class ScraperOrchestrator {
  private scrapers: BaseScraper[];
  private gemini: GeminiIntegration;

  constructor() {
    this.scrapers = [
      new EventbriteScraper(),
      new MeetupScraper(),
      new DevpostScraper(),
      new LumaScraper(),
      new WebinarNinjaScraper(),
      new GoToWebinarScraper(),
      new ZoomWebinarScraper(),
    ];
    this.gemini = new GeminiIntegration();
  }

  // ... (other methods remain the same) ...

  async scrapeAll(request: ScrapeRequest): Promise<{
    success: boolean;
    results: ScrapedResult[];
    totalNewWebinars: number;
    message: string;
  }> {
    const results: ScrapedResult[] = [];
    let totalNewWebinars = 0;
    const { category, keyword } = request;

    // Gemini scraping
    try {
      const jobId = await this.gemini.triggerScrape({ category, keyword });
      const geminiWebinars: ScrapedWebinar[] = await this.gemini.getScrapedData(jobId);
      const geminiValidated = geminiWebinars.map((webinar) => ({ ...webinar, sourcePlatform: 'Gemini' }));

      let geminiNewCount = 0;
      for (const webinar of geminiValidated) {
        const exists = await this.checkIfExistsById(webinar.id);
        if (!exists) {
          await storage.createWebinar(webinar as any);
          geminiNewCount++;
        }
      }

      results.push({
        source: 'Gemini',
        webinars: geminiValidated,
        success: true,
        count: geminiNewCount,
      });
      totalNewWebinars += geminiNewCount;
    } catch (error) {
      console.error('Gemini scraping failed:', error);
      results.push({
        source: 'Gemini',
        webinars: [],
        success: false,
        error: (error as any).message,
        count: 0,
      });
    }

    // ... (other scrapers remain the same) ...

    return { success: true, results, totalNewWebinars, message: 'Scraping completed' };
  }

  // ... (rest of the class remains the same) ...
}
