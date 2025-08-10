import { ScraperOrchestrator } from './scraper-orchestrator';
import { SEOContentGenerator } from '../seo/content-generator';

export class WebinarScheduler {
  private orchestrator: ScraperOrchestrator;
  private seoGenerator: SEOContentGenerator;
  private isRunning: boolean = false;

  constructor() {
    this.orchestrator = new ScraperOrchestrator();
    this.seoGenerator = new SEOContentGenerator();
  }

  async runDailyUpdate(): Promise<void> {
    if (this.isRunning) {
      console.log('Daily update already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting daily webinar update...');

    try {
      // Run all scrapers
      const scrapeResult = await this.orchestrator.scrapeAll({
        triggerType: 'daily',
        force: true
      });

      console.log(`Daily scrape completed: ${scrapeResult.totalNewWebinars} new webinars found`);

      // Generate SEO content if we have new webinars
      if (scrapeResult.totalNewWebinars > 0) {
        const contentResult = await this.seoGenerator.generateDailyContent();
        console.log(`Generated ${contentResult.total} SEO content pieces`);

        // Trigger Netlify rebuild for SEO pages
        await this.seoGenerator.triggerNetlifyBuild();
      }

    } catch (error) {
      console.error('Daily update failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async handleUserTrigger(category?: string, keyword?: string): Promise<void> {
    try {
      console.log(`User trigger: category=${category}, keyword=${keyword}`);
      
      const scrapeResult = await this.orchestrator.scrapeAll({
        category,
        keyword,
        triggerType: 'user_action',
        force: false // Use cache if available
      });

      console.log(`User-triggered scrape: ${scrapeResult.totalNewWebinars} new webinars`);
      
      // Generate quick SEO content for new findings
      if (scrapeResult.totalNewWebinars > 5) {
        await this.seoGenerator.generateDailyContent();
      }

    } catch (error) {
      console.error('User-triggered scrape failed:', error);
    }
  }

  startScheduler(): void {
    // Run daily at 6 AM
    const runDaily = () => {
      const now = new Date();
      const next6AM = new Date();
      next6AM.setHours(6, 0, 0, 0);
      
      if (next6AM <= now) {
        next6AM.setDate(next6AM.getDate() + 1);
      }
      
      const msUntil6AM = next6AM.getTime() - now.getTime();
      
      setTimeout(() => {
        this.runDailyUpdate();
        setInterval(() => this.runDailyUpdate(), 24 * 60 * 60 * 1000); // Every 24 hours
      }, msUntil6AM);
    };

    runDaily();
    console.log('WebinarHub scheduler started - daily updates at 6 AM');
  }
}