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
import fetch from 'node-fetch'; // Make sure you have node-fetch installed

interface ScrapedResult {
  source: string;
  webinars: any[];
  success: boolean;
  error?: string;
  count: number;
}

interface ScrapeRequest {
  sources?: string[];
  category?: string;
  keyword?: string;
  triggerType: 'user_action' | 'daily' | 'manual';
  force?: boolean;
}

export class ScraperOrchestrator {
  private scrapers: BaseScraper[];
  private geminiApiKey: string; // Add Gemini API key

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
    this.geminiApiKey = process.env.GEMINI_API_KEY || ''; // Get API key from environment
  }

  // ... (rest of the code remains the same until the scrapeAll function) ...

  async scrapeAll(request: ScrapeRequest): Promise<{
    success: boolean;
    results: ScrapedResult[];
    totalNewWebinars: number;
    message: string;
  }> {
    // ... (rest of the code remains the same until the for loop) ...

    for (const scraper of this.scrapers) {
      try {
        // ... (existing code) ...

      } catch (error) {
        // ... (existing code) ...
      }
    }

    // Add Gemini scraping here
    try {
      const geminiResponse = await fetch('/gemini/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.geminiApiKey}` // Add authorization if needed
        },
        body: JSON.stringify({ category, keyword }),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini scrape failed: ${geminiResponse.status} ${await geminiResponse.text()}`);
      }

      const { id } = await geminiResponse.json();

      const geminiDataResponse = await fetch(`/gemini/data/${id}`);
      if (!geminiDataResponse.ok) {
        throw new Error(`Gemini data retrieval failed: ${geminiDataResponse.status} ${await geminiDataResponse.text()}`);
      }

      const geminiWebinars: ScrapedWebinar[] = await geminiDataResponse.json();
      const geminiValidated = geminiWebinars.map(webinar => ({...webinar, sourcePlatform: 'Gemini'})); // Add sourcePlatform

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

    // ... (rest of the code remains the same) ...
  }

  // ... (rest of the class remains the same) ...
}
