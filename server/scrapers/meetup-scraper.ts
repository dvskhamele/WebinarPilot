import { BaseScraper, ScrapedWebinar, ScraperConfig } from './base-scraper';

export class MeetupScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Meetup',
      baseUrl: 'https://www.meetup.com',
      enabled: true,
      rateLimit: 1500, // 1.5 second between requests
    });
  }

  async scrapeWebinars(): Promise<ScrapedWebinar[]> {
    const webinars: ScrapedWebinar[] = [];
    
    try {
      const categories = [
        'tech',
        'data-science', 
        'python',
        'javascript',
        'marketing',
        'startup',
        'ai-machine-learning'
      ];

      for (const category of categories) {
        await this.delay(this.config.rateLimit || 1500);
        
        console.log(`Scraping Meetup: ${category}`);
        const events = await this.simulateMeetupApi(category);
        webinars.push(...events);
      }
    } catch (error) {
      console.error('Meetup scraping error:', error);
    }

    return webinars;
  }

  private async simulateMeetupApi(category: string): Promise<ScrapedWebinar[]> {
    // Simulating Meetup API response structure
    const mockEvents: ScrapedWebinar[] = [
      {
        title: "Free React.js Workshop: Building Modern Web Apps",
        description: "Join us for a hands-on workshop covering React hooks, state management, and modern development practices.",
        host: "React Developers Mumbai",
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 180,
        category: "Technology",
        tags: ["React", "JavaScript", "Frontend", "Web Development"],
        isLive: true,
        isFree: true,
        maxAttendees: 200,
        registrationUrl: "https://meetup.com/react-mumbai/events/react-workshop",
        meetingUrl: "https://zoom.us/j/meetup-react-workshop",
        imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
        sourceUrl: "https://meetup.com/react-mumbai/events/react-workshop",
        sourcePlatform: "Meetup"
      },
      {
        title: "Free AI/ML Study Group: Deep Learning Fundamentals",
        description: "Weekly study group covering deep learning concepts, neural networks, and practical implementations in TensorFlow.",
        host: "AI/ML Enthusiasts Delhi",
        dateTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        duration: 120,
        category: "Data Science",
        tags: ["AI", "Machine Learning", "Deep Learning", "TensorFlow"],
        isLive: true,
        isFree: true,
        maxAttendees: 150,
        registrationUrl: "https://meetup.com/ai-ml-delhi/events/deep-learning-study",
        meetingUrl: "https://meet.google.com/meetup-ai-study-group",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
        sourceUrl: "https://meetup.com/ai-ml-delhi/events/deep-learning-study",
        sourcePlatform: "Meetup"
      },
      {
        title: "Free Startup Pitch Practice: Get Feedback from VCs",
        description: "Practice your startup pitch and get constructive feedback from experienced VCs and entrepreneurs.",
        host: "Bangalore Startup Network",
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        duration: 150,
        category: "Business",
        tags: ["Startup", "Entrepreneurship", "Pitch", "VC"],
        isLive: true,
        isFree: true,
        maxAttendees: 100,
        registrationUrl: "https://meetup.com/bangalore-startups/events/pitch-practice",
        meetingUrl: "https://teams.microsoft.com/meetup-startup-pitch",
        imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
        sourceUrl: "https://meetup.com/bangalore-startups/events/pitch-practice",
        sourcePlatform: "Meetup"
      }
    ];

    // Filter based on category relevance
    return mockEvents.filter(event => 
      event.tags.some(tag => tag.toLowerCase().includes(category.replace('-', ' '))) ||
      event.category.toLowerCase().includes(category.replace('-', ' ')) ||
      event.title.toLowerCase().includes(category.replace('-', ' '))
    );
  }
}