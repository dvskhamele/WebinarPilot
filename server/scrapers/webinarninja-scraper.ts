import { BaseScraper, ScrapedWebinar, ScraperConfig } from './base-scraper';

export class WebinarNinjaScraper extends BaseScraper {
  constructor() {
    super({
      name: 'WebinarNinja',
      baseUrl: 'https://webinarninja.com',
      enabled: true,
      rateLimit: 2000, // 2 seconds between requests
    });
  }

  async scrapeWebinars(): Promise<ScrapedWebinar[]> {
    const webinars: ScrapedWebinar[] = [];
    
    try {
      const categories = ['business', 'marketing', 'technology', 'education', 'health'];

      for (const category of categories) {
        await this.delay(this.config.rateLimit || 2000);
        console.log(`Scraping WebinarNinja: ${category}`);
        const events = await this.simulateWebinarNinjaApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error('WebinarNinja scraping error:', error);
    }

    return webinars;
  }

  private async simulateWebinarNinjaApi(category: string): Promise<ScrapedWebinar[]> {
    const mockEvents: ScrapedWebinar[] = [
      {
        title: "Free Content Marketing Masterclass: Drive Traffic Without Ads",
        description: "Learn proven content marketing strategies to attract your ideal customers organically. No paid advertising required.",
        host: "Digital Marketing Academy",
        dateTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
        duration: 90,
        category: "Marketing",
        tags: ["Content Marketing", "Organic Traffic", "SEO", "Digital Strategy"],
        isLive: true,
        isFree: true,
        maxAttendees: 500,
        registrationUrl: "https://webinarninja.com/content-marketing-masterclass",
        meetingUrl: "https://zoom.us/j/webinarninja-content-marketing",
        imageUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07",
        sourceUrl: "https://webinarninja.com/content-marketing-masterclass",
        sourcePlatform: "WebinarNinja"
      },
      {
        title: "Free Business Growth Workshop: Scale to 7 Figures",
        description: "Discover the exact systems and strategies used by successful entrepreneurs to scale their businesses to 7 figures.",
        host: "Business Growth Institute",
        dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        duration: 120,
        category: "Business",
        tags: ["Business Growth", "Scaling", "Entrepreneurship", "Strategy"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://webinarninja.com/business-growth-workshop",
        meetingUrl: "https://meet.google.com/webinarninja-business-growth",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        sourceUrl: "https://webinarninja.com/business-growth-workshop",
        sourcePlatform: "WebinarNinja"
      },
      {
        title: "Free Health & Wellness Coaching Certification Overview",
        description: "Explore the fundamentals of health coaching and discover if this rewarding career path is right for you.",
        host: "Wellness Coaching Institute",
        dateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        duration: 75,
        category: "Health",
        tags: ["Health Coaching", "Wellness", "Certification", "Career Development"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://webinarninja.com/health-coaching-overview",
        meetingUrl: "https://teams.microsoft.com/webinarninja-health-coaching",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        sourceUrl: "https://webinarninja.com/health-coaching-overview",
        sourcePlatform: "WebinarNinja"
      }
    ];

    return mockEvents.filter(event => 
      event.category.toLowerCase().includes(category) ||
      event.tags.some(tag => tag.toLowerCase().includes(category))
    );
  }
}