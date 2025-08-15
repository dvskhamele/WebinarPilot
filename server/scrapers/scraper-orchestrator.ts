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
        const errorText = await response.text();
        throw new Error(`Edge function error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Edge function call failed:', error);
      throw error;
    }
  }

  private async checkIfExistsById(id: string): Promise<boolean> {
    try {
      const existing = await storage.getWebinar(id);
      return !!existing;
    } catch (error) {
      console.error('Existence check failed:', error);
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
    
  // Always run scrapers, ignore cache
  // ...existing code...

    const results: ScrapedResult[] = [];
    let totalNewWebinars = 0;

    const scrapersToRun = sources ? 
      this.scrapers.filter(s => sources.includes(s['config']['name'].toLowerCase())) :
      this.scrapers;

    for (const scraper of scrapersToRun) {
      try {
        console.log(`Running scraper: ${scraper['config']['name']}`);
        // Use validated webinar objects matching our storage schema
        const validated = await scraper.scrapeAndValidate();
        
        let newCount = 0;
        for (const webinar of validated) {
          const exists = await this.checkIfExistsById(webinar.id);
          if (!exists) {
            await storage.createWebinar(webinar as any);
            newCount++;
          }
        }

        const result: ScrapedResult = {
          source: scraper['config']['name'],
          webinars: validated,
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
          `Successfully scraped ${validated.length} webinars, ${newCount} new`
        );

      } catch (error) {
        console.error(`Error in ${scraper['config']['name']} scraper:`, error);
        
        const result: ScrapedResult = {
          source: scraper['config']['name'],
          webinars: [],
          success: false,
          error: (error as any).message,
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
          (error as any).message
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