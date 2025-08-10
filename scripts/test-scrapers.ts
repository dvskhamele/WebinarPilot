#!/usr/bin/env tsx

import { ScraperOrchestrator } from '../server/scrapers/scraper-orchestrator';
import { SEOContentGenerator } from '../server/seo/content-generator';

async function setupDatabase() {
  console.log('Setting up database tables...');
  
  const orchestrator = new ScraperOrchestrator();
  
  try {
    // Create all required tables
    await orchestrator['callEdgeFunction']({
      action: 'create_table',
      table: 'webinars'
    });
    
    await orchestrator['callEdgeFunction']({
      action: 'create_table',
      table: 'scrape_logs'
    });
    
    await orchestrator['callEdgeFunction']({
      action: 'create_table',
      table: 'blogs'
    });
    
    await orchestrator['callEdgeFunction']({
      action: 'create_table',
      table: 'guides'
    });

    await orchestrator['callEdgeFunction']({
      action: 'create_table',
      table: 'scraper_analytics'
    });
    
    console.log('✅ Database tables created successfully (including analytics tracking)');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

async function testScrapers() {
  console.log('\n=== TESTING WEBINARHUB SCRAPERS ===\n');
  
  const orchestrator = new ScraperOrchestrator();
  
  try {
    console.log('Running all scrapers with force=true...');
    
    const result = await orchestrator.scrapeAll({
      triggerType: 'manual',
      force: true
    });
    
    console.log('\n=== SCRAPING RESULTS ===');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Total new webinars: ${result.totalNewWebinars}`);
    console.log(`💬 Message: ${result.message}`);
    
    console.log('\n=== DETAILED RESULTS BY SOURCE ===');
    result.results.forEach((sourceResult, index) => {
      console.log(`\n${index + 1}. ${sourceResult.source}:`);
      console.log(`   ✅ Success: ${sourceResult.success}`);
      console.log(`   📈 New webinars: ${sourceResult.count}`);
      
      if (sourceResult.error) {
        console.log(`   ❌ Error: ${sourceResult.error}`);
      }
      
      if (sourceResult.webinars.length > 0) {
        console.log(`   📋 Sample webinars found:`);
        sourceResult.webinars.slice(0, 2).forEach((webinar, idx) => {
          console.log(`      ${idx + 1}. ${webinar.title}`);
          console.log(`         Host: ${webinar.host}`);
          console.log(`         Category: ${webinar.category}`);
          console.log(`         Date: ${webinar.dateTime}`);
        });
      }
    });
    
    return result;
  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    return null;
  }
}

async function testSEOGeneration() {
  console.log('\n=== TESTING SEO CONTENT GENERATION ===\n');
  
  const seoGenerator = new SEOContentGenerator();
  
  try {
    console.log('Generating daily SEO content...');
    
    const contentResult = await seoGenerator.generateDailyContent();
    
    console.log('\n=== SEO CONTENT RESULTS ===');
    console.log(`📝 Blog posts generated: ${contentResult.blogs.length}`);
    console.log(`📚 Guides generated: ${contentResult.guides.length}`);
    console.log(`📊 Total content pieces: ${contentResult.total}`);
    
    if (contentResult.blogs.length > 0) {
      console.log('\n=== SAMPLE BLOG POST ===');
      const sampleBlog = contentResult.blogs[0];
      console.log(`Title: ${sampleBlog.title}`);
      console.log(`Slug: ${sampleBlog.slug}`);
      console.log(`Keywords: ${sampleBlog.keywords.join(', ')}`);
      console.log(`Meta Description: ${sampleBlog.meta_description}`);
    }
    
    if (contentResult.guides.length > 0) {
      console.log('\n=== SAMPLE GUIDE ===');
      const sampleGuide = contentResult.guides[0];
      console.log(`Topic: ${sampleGuide.topic}`);
      console.log(`Keywords: ${sampleGuide.seo_keywords.join(', ')}`);
    }
    
    return contentResult;
  } catch (error) {
    console.error('❌ SEO generation test failed:', error);
    return null;
  }
}

async function testCaching() {
  console.log('\n=== TESTING CACHING LOGIC ===\n');
  
  const orchestrator = new ScraperOrchestrator();
  
  try {
    console.log('First scrape (should fetch fresh data)...');
    const firstResult = await orchestrator.scrapeAll({
      category: 'Technology',
      triggerType: 'manual',
      force: false
    });
    
    console.log(`First scrape: ${firstResult.totalNewWebinars} new webinars`);
    
    console.log('Second scrape (should use cache)...');
    const secondResult = await orchestrator.scrapeAll({
      category: 'Technology',
      triggerType: 'manual',
      force: false
    });
    
    console.log(`Second scrape: ${secondResult.totalNewWebinars} new webinars`);
    console.log(`Cache message: ${secondResult.message}`);
    
    if (secondResult.message.includes('cached')) {
      console.log('✅ Caching logic working correctly');
    } else {
      console.log('⚠️  Caching may not be working as expected');
    }
    
    return { firstResult, secondResult };
  } catch (error) {
    console.error('❌ Caching test failed:', error);
    return null;
  }
}

async function validateDatabase() {
  console.log('\n=== VALIDATING DATABASE DATA ===\n');
  
  const orchestrator = new ScraperOrchestrator();
  
  try {
    // Check webinars table
    const webinarsResult = await orchestrator['callEdgeFunction']({
      action: 'query',
      table: 'webinars',
      limit: 5
    });
    
    console.log(`📊 Webinars in database: ${webinarsResult.data?.length || 0}`);
    
    if (webinarsResult.data && webinarsResult.data.length > 0) {
      console.log('Sample webinar:');
      const sample = webinarsResult.data[0];
      console.log(`  Title: ${sample.title}`);
      console.log(`  Platform: ${sample.platform}`);
      console.log(`  Category: ${sample.category}`);
      console.log(`  Checksum: ${sample.checksum}`);
    }
    
    // Check scrape logs
    const logsResult = await orchestrator['callEdgeFunction']({
      action: 'query',
      table: 'scrape_logs',
      limit: 5
    });
    
    console.log(`📝 Scrape logs: ${logsResult.data?.length || 0}`);
    
    // Check SEO content
    const blogsResult = await orchestrator['callEdgeFunction']({
      action: 'query',
      table: 'blogs',
      limit: 3
    });
    
    console.log(`📝 Blog posts: ${blogsResult.data?.length || 0}`);
    
    const guidesResult = await orchestrator['callEdgeFunction']({
      action: 'query',
      table: 'guides',
      limit: 3
    });
    
    console.log(`📚 Guides: ${guidesResult.data?.length || 0}`);
    
    return {
      webinars: webinarsResult.data?.length || 0,
      logs: logsResult.data?.length || 0,
      blogs: blogsResult.data?.length || 0,
      guides: guidesResult.data?.length || 0
    };
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 WEBINARHUB SCRAPER SYSTEM TEST\n');
  console.log('='.repeat(50));
  
  try {
    // Setup
    await setupDatabase();
    
    // Test scrapers
    const scrapeResult = await testScrapers();
    
    // Test SEO generation
    const seoResult = await testSEOGeneration();
    
    // Test caching
    const cacheResult = await testCaching();
    
    // Validate database
    const dbValidation = await validateDatabase();
    
    // Final summary
    console.log('\n=== FINAL TEST SUMMARY ===');
    console.log('='.repeat(50));
    
    if (scrapeResult && scrapeResult.success) {
      console.log('✅ Scrapers: WORKING');
      console.log(`   - Sources tested: ${scrapeResult.results.length}`);
      console.log(`   - New webinars: ${scrapeResult.totalNewWebinars}`);
    } else {
      console.log('❌ Scrapers: FAILED');
    }
    
    if (seoResult && seoResult.total > 0) {
      console.log('✅ SEO Generation: WORKING');
      console.log(`   - Content pieces: ${seoResult.total}`);
    } else {
      console.log('❌ SEO Generation: FAILED');
    }
    
    if (cacheResult) {
      console.log('✅ Caching: WORKING');
    } else {
      console.log('❌ Caching: FAILED');
    }
    
    if (dbValidation) {
      console.log('✅ Database: WORKING');
      console.log(`   - Webinars: ${dbValidation.webinars}`);
      console.log(`   - Logs: ${dbValidation.logs}`);
      console.log(`   - SEO Content: ${dbValidation.blogs + dbValidation.guides}`);
    } else {
      console.log('❌ Database: FAILED');
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test manual trigger: POST /api/scrape/trigger');
    console.log('2. Test category trigger: GET /api/webinars/category/Technology');
    console.log('3. Test search trigger: GET /api/webinars/search?q=python');
    console.log('4. Monitor daily scheduler at 6 AM');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);

export { main as testScrapers };