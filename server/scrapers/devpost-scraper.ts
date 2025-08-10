import { BaseScraper, ScrapedWebinar, ScraperConfig } from './base-scraper';

export class DevpostScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Devpost',
      baseUrl: 'https://devpost.com',
      enabled: true,
      rateLimit: 1200, // 1.2 second between requests
    });
  }

  async scrapeWebinars(): Promise<ScrapedWebinar[]> {
    const webinars: ScrapedWebinar[] = [];
    
    try {
      const hackathonCategories = [
        'web-development',
        'mobile',
        'ai-machine-learning',
        'blockchain',
        'fintech',
        'healthtech',
        'edtech'
      ];

      for (const category of hackathonCategories) {
        await this.delay(this.config.rateLimit || 1200);
        
        console.log(`Scraping Devpost: ${category}`);
        const events = await this.simulateDevpostApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error('Devpost scraping error:', error);
    }

    return webinars;
  }

  private async simulateDevpostApi(category: string): Promise<ScrapedWebinar[]> {
    // Simulating Devpost hackathon/workshop events
    const mockEvents: ScrapedWebinar[] = [
      {
        title: "Free Blockchain Development Workshop: Build Your First DApp",
        description: "Learn to build decentralized applications using Ethereum, Solidity, and Web3.js. Perfect for developers new to blockchain.",
        host: "Blockchain Developers India",
        dateTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        duration: 240,
        category: "Technology",
        tags: ["Blockchain", "Ethereum", "Solidity", "Web3", "DApp"],
        isLive: true,
        isFree: true,
        maxAttendees: 300,
        registrationUrl: "https://devpost.com/workshops/blockchain-dapp-workshop",
        meetingUrl: "https://zoom.us/j/devpost-blockchain-workshop",
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
        sourceUrl: "https://devpost.com/workshops/blockchain-dapp-workshop",
        sourcePlatform: "Devpost"
      },
      {
        title: "Free Mobile App Development: React Native Crash Course",
        description: "Build cross-platform mobile apps with React Native. Covers navigation, state management, and deployment.",
        host: "Mobile Dev Community",
        dateTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        duration: 180,
        category: "Technology",
        tags: ["React Native", "Mobile Development", "iOS", "Android", "JavaScript"],
        isLive: true,
        isFree: true,
        maxAttendees: 250,
        registrationUrl: "https://devpost.com/workshops/react-native-mobile-dev",
        meetingUrl: "https://meet.google.com/devpost-mobile-workshop",
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
        sourceUrl: "https://devpost.com/workshops/react-native-mobile-dev",
        sourcePlatform: "Devpost"
      },
      {
        title: "Free FinTech Innovation Workshop: Payment Systems & APIs",
        description: "Explore modern payment systems, APIs, and financial technology trends. Learn to integrate payment solutions.",
        host: "FinTech Innovators",
        dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        duration: 150,
        category: "Finance",
        tags: ["FinTech", "Payment Systems", "APIs", "Financial Technology", "Integration"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://devpost.com/workshops/fintech-payment-systems",
        meetingUrl: "https://teams.microsoft.com/devpost-fintech-workshop",
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        sourceUrl: "https://devpost.com/workshops/fintech-payment-systems",
        sourcePlatform: "Devpost"
      }
    ];

    return mockEvents.filter(event => 
      event.tags.some(tag => tag.toLowerCase().includes(category.replace('-', ' '))) ||
      event.category.toLowerCase().includes(category.replace('-', ' '))
    );
  }
}