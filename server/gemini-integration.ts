import fetch from 'node-fetch';

interface GeminiScrapeRequest {
  category?: string;
  keyword?: string;
}

interface GeminiScrapeResponse {
  id: string;
}

export class GeminiIntegration {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set.');
    }
  }

  async triggerScrape(request: GeminiScrapeRequest): Promise<string> {
    const response = await fetch('/gemini/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini scrape failed: ${response.status} ${errorText}`);
    }

    const data: GeminiScrapeResponse = await response.json();
    return data.id;
  }

  async getScrapedData(jobId: string): Promise<any[]> {
    const response = await fetch(`/gemini/data/${jobId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini data retrieval failed: ${response.status} ${errorText}`);
    }
    return response.json();
  }
}
