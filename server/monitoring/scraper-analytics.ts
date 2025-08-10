interface ScraperMetrics {
  scraperId: string;
  scraperName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  webinarsFound: number;
  webinarsAdded: number;
  webinarsUpdated: number;
  errors: string[];
  success: boolean;
  category?: string;
  keyword?: string;
}

interface PerformanceReport {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  totalWebinarsDiscovered: number;
  topPerformingScrapers: { name: string; successRate: number; avgWebinars: number }[];
  errorSummary: { error: string; count: number }[];
  categoryPerformance: { category: string; webinarsFound: number; scrapers: number }[];
}

export class ScraperAnalytics {
  private metrics: ScraperMetrics[] = [];
  private supabaseUrl: string;
  private supabaseKey: string;
  private edgeFunctionUrl: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://brroucjplqmngljroknr.supabase.co';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc';
    this.edgeFunctionUrl = process.env.SUPABASE_FUNCTION_URL || 'https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler';
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
        throw new Error(`Edge function error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics edge function call failed:', error);
      throw error;
    }
  }

  startScraperRun(scraperId: string, scraperName: string, category?: string, keyword?: string): string {
    const runId = `${scraperId}-${Date.now()}`;
    const metric: ScraperMetrics = {
      scraperId: runId,
      scraperName,
      startTime: new Date(),
      webinarsFound: 0,
      webinarsAdded: 0,
      webinarsUpdated: 0,
      errors: [],
      success: false,
      category,
      keyword
    };
    
    this.metrics.push(metric);
    return runId;
  }

  recordScraperResult(runId: string, webinarsFound: number, webinarsAdded: number, webinarsUpdated: number, errors: string[] = []) {
    const metric = this.metrics.find(m => m.scraperId === runId);
    if (metric) {
      metric.endTime = new Date();
      metric.duration = metric.endTime.getTime() - metric.startTime.getTime();
      metric.webinarsFound = webinarsFound;
      metric.webinarsAdded = webinarsAdded;
      metric.webinarsUpdated = webinarsUpdated;
      metric.errors = errors;
      metric.success = errors.length === 0 && webinarsFound >= 0;
    }
  }

  async persistMetrics(): Promise<void> {
    try {
      const recentMetrics = this.metrics.slice(-10); // Keep last 10 runs
      
      for (const metric of recentMetrics) {
        await this.callEdgeFunction({
          action: 'insert',
          table: 'scraper_analytics',
          data: {
            scraper_id: metric.scraperId,
            scraper_name: metric.scraperName,
            start_time: metric.startTime.toISOString(),
            end_time: metric.endTime?.toISOString(),
            duration_ms: metric.duration,
            webinars_found: metric.webinarsFound,
            webinars_added: metric.webinarsAdded,
            webinars_updated: metric.webinarsUpdated,
            errors: JSON.stringify(metric.errors),
            success: metric.success,
            category: metric.category,
            keyword: metric.keyword,
            created_at: new Date().toISOString()
          }
        });
      }
      
      // Clear old metrics to prevent memory buildup
      this.metrics = this.metrics.slice(-50);
    } catch (error) {
      console.error('Error persisting scraper analytics:', error);
    }
  }

  generatePerformanceReport(): PerformanceReport {
    const recentMetrics = this.metrics.slice(-100); // Analyze last 100 runs
    
    if (recentMetrics.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageDuration: 0,
        totalWebinarsDiscovered: 0,
        topPerformingScrapers: [],
        errorSummary: [],
        categoryPerformance: []
      };
    }

    const totalRuns = recentMetrics.length;
    const successfulRuns = recentMetrics.filter(m => m.success).length;
    const successRate = (successfulRuns / totalRuns) * 100;
    
    const avgDuration = recentMetrics
      .filter(m => m.duration)
      .reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.filter(m => m.duration).length;

    const totalWebinarsDiscovered = recentMetrics.reduce((sum, m) => sum + m.webinarsFound, 0);

    // Scraper performance analysis
    const scraperStats = new Map<string, { runs: number; successes: number; totalWebinars: number }>();
    recentMetrics.forEach(m => {
      const current = scraperStats.get(m.scraperName) || { runs: 0, successes: 0, totalWebinars: 0 };
      current.runs++;
      if (m.success) current.successes++;
      current.totalWebinars += m.webinarsFound;
      scraperStats.set(m.scraperName, current);
    });

    const topPerformingScrapers = Array.from(scraperStats.entries())
      .map(([name, stats]) => ({
        name,
        successRate: (stats.successes / stats.runs) * 100,
        avgWebinars: stats.totalWebinars / stats.runs
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    // Error analysis
    const errorCount = new Map<string, number>();
    recentMetrics.forEach(m => {
      m.errors.forEach(error => {
        errorCount.set(error, (errorCount.get(error) || 0) + 1);
      });
    });

    const errorSummary = Array.from(errorCount.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Category performance
    const categoryStats = new Map<string, { webinarsFound: number; scrapers: Set<string> }>();
    recentMetrics.forEach(m => {
      if (m.category) {
        const current = categoryStats.get(m.category) || { webinarsFound: 0, scrapers: new Set() };
        current.webinarsFound += m.webinarsFound;
        current.scrapers.add(m.scraperName);
        categoryStats.set(m.category, current);
      }
    });

    const categoryPerformance = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        webinarsFound: stats.webinarsFound,
        scrapers: stats.scrapers.size
      }))
      .sort((a, b) => b.webinarsFound - a.webinarsFound);

    return {
      totalRuns,
      successRate,
      averageDuration: Math.round(avgDuration),
      totalWebinarsDiscovered,
      topPerformingScrapers,
      errorSummary,
      categoryPerformance
    };
  }

  async generateDetailedReport(): Promise<string> {
    const report = this.generatePerformanceReport();
    const now = new Date().toLocaleString('en-IN');

    return `
# WebinarHub Scraper Performance Report - ${now}

## 🎯 Executive Summary
- **Total Scraping Runs**: ${report.totalRuns}
- **Success Rate**: ${report.successRate.toFixed(1)}%
- **Average Duration**: ${report.averageDuration}ms
- **Total Webinars Discovered**: ${report.totalWebinarsDiscovered}

## 🚀 Top Performing Scrapers

${report.topPerformingScrapers.map((scraper, index) => `
### ${index + 1}. ${scraper.name}
- **Success Rate**: ${scraper.successRate.toFixed(1)}%
- **Average Webinars per Run**: ${scraper.avgWebinars.toFixed(1)}
- **Performance Grade**: ${scraper.successRate >= 90 ? 'A+' : scraper.successRate >= 75 ? 'A' : scraper.successRate >= 60 ? 'B' : 'C'}
`).join('')}

## 📊 Category Performance Analysis

${report.categoryPerformance.map((cat, index) => `
### ${index + 1}. ${cat.category}
- **Total Webinars Found**: ${cat.webinarsFound}
- **Active Scrapers**: ${cat.scrapers}
- **Market Share**: ${((cat.webinarsFound / report.totalWebinarsDiscovered) * 100).toFixed(1)}%
`).join('')}

## ⚠️ Error Analysis

${report.errorSummary.length > 0 ? report.errorSummary.map((error, index) => `
### ${index + 1}. ${error.error}
- **Occurrences**: ${error.count}
- **Impact**: ${((error.count / report.totalRuns) * 100).toFixed(1)}% of runs
`).join('') : 'No significant errors detected in recent runs.'}

## 🔧 Optimization Recommendations

### Performance Improvements
- **Cache Optimization**: ${report.averageDuration > 5000 ? 'Consider implementing smarter caching to reduce response times' : 'Cache performance is optimal'}
- **Error Handling**: ${report.successRate < 90 ? 'Focus on improving error handling and retry logic' : 'Error handling is performing well'}
- **Scraper Diversification**: ${report.topPerformingScrapers.length < 5 ? 'Consider adding more scraper sources for better coverage' : 'Good scraper diversity achieved'}

### Data Quality
- **Deduplication**: Monitor for duplicate content across sources
- **Data Freshness**: Ensure scraped data remains current and relevant
- **Category Coverage**: Expand into underrepresented categories

## 📈 Growth Metrics

### Weekly Performance Trend
- **Webinar Discovery Rate**: ${(report.totalWebinarsDiscovered / Math.max(report.totalRuns, 1)).toFixed(1)} webinars per run
- **System Reliability**: ${report.successRate.toFixed(1)}% uptime
- **Data Velocity**: ${Math.round(report.totalWebinarsDiscovered / 7)} webinars per day

---

*Report generated automatically by WebinarHub Analytics Engine*
*Next automated report: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}*
`;
  }

  async logScraperHealth(): Promise<void> {
    const report = this.generatePerformanceReport();
    console.log(`\n🔍 Scraper Health Check - ${new Date().toLocaleTimeString()}`);
    console.log(`📊 Success Rate: ${report.successRate.toFixed(1)}%`);
    console.log(`⏱️ Avg Duration: ${report.averageDuration}ms`);
    console.log(`🎯 Webinars Found: ${report.totalWebinarsDiscovered}`);
    
    if (report.errorSummary.length > 0) {
      console.log(`⚠️ Recent Errors: ${report.errorSummary.length}`);
      report.errorSummary.slice(0, 3).forEach(error => {
        console.log(`   - ${error.error} (${error.count}x)`);
      });
    }
  }
}

export const scraperAnalytics = new ScraperAnalytics();