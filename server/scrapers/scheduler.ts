// ... (imports remain the same) ...

export class WebinarScheduler {
  // ... (constructor remains the same) ...

  async runDailyUpdate(): Promise<void> {
    if (this.isRunning) {
      console.log('Daily update already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting daily webinar update...');

    try {
      // Run all scrapers (Gemini is now the primary scraper)
      const scrapeResult = await this.orchestrator.scrapeAll({
        triggerType: 'daily',
        force: true,
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

  // ... (rest of the class remains the same) ...
}
