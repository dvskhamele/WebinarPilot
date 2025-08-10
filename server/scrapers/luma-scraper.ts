import { BaseScraper, ScrapedWebinar, ScraperConfig } from './base-scraper';

export class LumaScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Luma',
      baseUrl: 'https://lu.ma',
      enabled: true,
      rateLimit: 1000,
    });
  }

  async scrapeWebinars(): Promise<ScrapedWebinar[]> {
    const webinars: ScrapedWebinar[] = [];
    
    try {
      const topics = ['tech-talks', 'startup-events', 'design-workshops', 'developer-meetups'];

      for (const topic of topics) {
        await this.delay(this.config.rateLimit || 1000);
        console.log(`Scraping Luma: ${topic}`);
        const events = await this.simulateLumaApi(topic);
        webinars.push(...events);
      }
    } catch (error) {
      console.error('Luma scraping error:', error);
    }

    return webinars;
  }

  private async simulateLumaApi(topic: string): Promise<ScrapedWebinar[]> {
    const mockEvents: ScrapedWebinar[] = [
      {
        title: "Free UI/UX Design Workshop: Design Systems & Figma",
        description: "Learn to create scalable design systems using Figma. Perfect for designers and developers working together.",
        host: "Design Community India",
        dateTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        duration: 120,
        category: "Design",
        tags: ["UI/UX", "Design Systems", "Figma", "Product Design"],
        isLive: true,
        isFree: true,
        maxAttendees: 180,
        registrationUrl: "https://lu.ma/design-systems-workshop",
        meetingUrl: "https://zoom.us/j/luma-design-workshop",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
        sourceUrl: "https://lu.ma/design-systems-workshop",
        sourcePlatform: "Luma"
      },
      {
        title: "Free Developer Career Workshop: From Code to Leadership",
        description: "Navigate your tech career path from junior developer to tech lead. Insights from industry experts.",
        host: "Tech Career Mentors",
        dateTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        duration: 90,
        category: "Career",
        tags: ["Career Development", "Tech Leadership", "Mentorship", "Professional Growth"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://lu.ma/developer-career-workshop",
        meetingUrl: "https://meet.google.com/luma-career-workshop",
        imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
        sourceUrl: "https://lu.ma/developer-career-workshop",
        sourcePlatform: "Luma"
      }
    ];

    return mockEvents.filter(event => 
      event.tags.some(tag => tag.toLowerCase().includes(topic.replace('-', ' '))) ||
      event.title.toLowerCase().includes(topic.replace('-', ' '))
    );
  }
}