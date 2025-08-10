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

interface SupabaseWebinar {
  id: string;
  title: string;
  date: string;
  time: string;
  platform: string;
  link: string;
  description: string;
  category: string;
  source: string;
  checksum: string;
  last_fetched: string;
  created_at?: string;
  updated_at?: string;
}

export class ScraperOrchestrator {
  private scrapers: BaseScraper[];
  private supabaseUrl: string;
  private supabaseKey: string;
  private edgeFunctionUrl: string;

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

    this.supabaseUrl = process.env.SUPABASE_URL || 'https://brroucjplqmngljroknr.supabase.co';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc';
    this.edgeFunctionUrl = process.env.SUPABASE_FUNCTION_URL || 'https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler';
  }

  private generateChecksum(title: string, date: string, platform: string, source: string): string {
    const content = `${title}|${date}|${platform}|${source}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private convertScrapedToSupabaseFormat(scraped: ScrapedWebinar): SupabaseWebinar {
    const dateStr = scraped.dateTime.toISOString().split('T')[0];
    const timeStr = scraped.dateTime.toTimeString().split(' ')[0];
    
    return {
      id: crypto.randomUUID(),
      title: scraped.title,
      date: dateStr,
      time: timeStr,
      platform: scraped.sourcePlatform,
      link: scraped.registrationUrl,
      description: scraped.description,
      category: scraped.category,
      source: scraped.sourcePlatform,
      checksum: this.generateChecksum(scraped.title, dateStr, scraped.sourcePlatform, scraped.sourcePlatform),
      last_fetched: new Date().toISOString(),
    };
  }

  private async callEdgeFunction(payload: any): Promise<any> {
    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Edge function call failed:', error);
      throw error;
    }
  }

  private async checkIfExists(checksum: string): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction({
        action: 'query',
        table: 'webinars',
        where: { checksum },
        limit: 1
      });
      return result.data && result.data.length > 0;
    } catch (error) {
      console.error('Error checking existing webinar:', error);
      return false;
    }
  }

  private async insertWebinar(webinar: SupabaseWebinar): Promise<boolean> {
    try {
      const exists = await this.checkIfExists(webinar.checksum);
      
      if (exists) {
        // Update existing record
        await this.callEdgeFunction({
          action: 'update',
          table: 'webinars',
          where: { checksum: webinar.checksum },
          data: {
            last_fetched: webinar.last_fetched,
            updated_at: new Date().toISOString()
          }
        });
        return false; // Not a new insert
      } else {
        // Insert new record
        await this.callEdgeFunction({
          action: 'insert',
          table: 'webinars',
          data: {
            ...webinar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
        return true; // New insert
      }
    } catch (error) {
      console.error('Error inserting/updating webinar:', error);
      return false;
    }
  }

  private async logScrapeRun(
    source: string, 
    triggerType: string, 
    categoryOrKeyword: string, 
    recordsFetched: number, 
    status: string, 
    message?: string
  ): Promise<void> {
    try {
      await this.callEdgeFunction({
        action: 'insert',
        table: 'scrape_logs',
        data: {
          id: crypto.randomUUID(),
          run_time: new Date().toISOString(),
          source,
          trigger_type: triggerType,
          category_or_keyword: categoryOrKeyword,
          records_fetched: recordsFetched,
          status,
          message: message || null
        }
      });
    } catch (error) {
      console.error('Error logging scrape run:', error);
    }
  }

  private async shouldSkipScraping(scope: string): Promise<boolean> {
    try {
      // Check if we scraped this scope in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const result = await this.callEdgeFunction({
        action: 'query',
        table: 'scrape_logs',
        where: {
          category_or_keyword: scope,
          run_time: `>${oneHourAgo}`
        },
        limit: 1
      });

      return result.data && result.data.length > 0;
    } catch (error) {
      console.error('Error checking scrape cache:', error);
      return false;
    }
  }

  async scrapeAll(request: ScrapeRequest): Promise<{
    success: boolean;
    results: ScrapedResult[];
    totalNewWebinars: number;
    message: string;
  }> {
    const { sources, category, keyword, triggerType, force = false } = request;
    const scope = category || keyword || 'all';
    
    // Check caching unless force is true
    if (!force && await this.shouldSkipScraping(scope)) {
      console.log(`Skipping scrape for ${scope} - cached results available`);
      return {
        success: true,
        results: [],
        totalNewWebinars: 0,
        message: `Cached results returned for ${scope} (scraped within last hour)`
      };
    }

    const results: ScrapedResult[] = [];
    let totalNewWebinars = 0;

    const scrapersToRun = sources ? 
      this.scrapers.filter(s => sources.includes(s['config']['name'].toLowerCase())) :
      this.scrapers;

    for (const scraper of scrapersToRun) {
      try {
        console.log(`Running scraper: ${scraper['config']['name']}`);
        // Use raw scraped data (includes registrationUrl and sourcePlatform)
        const scrapedRaw = await scraper.scrapeWebinars();
        // Validate locally (future events with required fields)
        const validWebinars = scrapedRaw.filter(w =>
          !!(w && w.title && w.host && w.dateTime && w.registrationUrl && new Date(w.dateTime) > new Date())
        );
        
        let newCount = 0;
        for (const webinar of validWebinars) {
          const supabaseWebinar = this.convertScrapedToSupabaseFormat(webinar);
          const isNew = await this.insertWebinar(supabaseWebinar);
          if (isNew) newCount++;
        }

        const result: ScrapedResult = {
          source: scraper['config']['name'],
          webinars: validWebinars,
          success: true,
          count: newCount
        };

        results.push(result);
        totalNewWebinars += newCount;

        // Log successful scrape
        await this.logScrapeRun(
          scraper['config']['name'],
          triggerType,
          scope,
          newCount,
          'success',
          `Successfully scraped ${validWebinars.length} webinars, ${newCount} new`
        );

      } catch (error) {
        console.error(`Error in ${scraper['config']['name']} scraper:`, error);
        
        const result: ScrapedResult = {
          source: scraper['config']['name'],
          webinars: [],
          success: false,
          error: error.message,
          count: 0
        };

        results.push(result);

        // Log failed scrape
        await this.logScrapeRun(
          scraper['config']['name'],
          triggerType,
          scope,
          0,
          'error',
          error.message
        );
      }
    }

    return {
      success: true,
      results,
      totalNewWebinars,
      message: `Scraped ${totalNewWebinars} new webinars from ${results.length} sources`
    };
  }

  async testAllScrapers(): Promise<void> {
    console.log('=== TESTING ALL SCRAPERS ===');
    
    const testResult = await this.scrapeAll({
      triggerType: 'manual',
      force: true
    });

    console.log('\n=== SCRAPER TEST RESULTS ===');
    console.log(`Total new webinars: ${testResult.totalNewWebinars}`);
    console.log(`Message: ${testResult.message}`);
    
    testResult.results.forEach(result => {
      console.log(`\n${result.source}:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  New webinars: ${result.count}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  }
}