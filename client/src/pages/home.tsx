import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WebinarCard } from '@/components/webinar-card';
import { Webinar } from '@shared/types';
import { CATEGORIES } from '@/lib/constants';
import { HomeGroups } from '@/components/sections/home-groups';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const apiUrl = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return `/api/webinars/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
    if (selectedCategory) {
      return `/api/webinars/category/${encodeURIComponent(selectedCategory)}`;
    }
    return '/api/webinars';
  }, [searchQuery, selectedCategory]);

  const { data: webinars = [], isLoading } = useQuery<Webinar[]>({
    queryKey: [apiUrl],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WebinarHub',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webinars/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }), []);

  const featuredCategories = CATEGORIES.slice(0, 6);
  const trendingTopics = [
    'AI & Machine Learning',
    'Data Science',
    'Digital Marketing',
    'Product Management',
    'Cloud & DevOps',
    'Career Growth',
  ];

  return (
    <div className="space-y-12">
      {/* SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Discover <span className="text-indigo-600">Live</span> Workshops & Webinars
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
          Real-time listings from across the web. Explore technology, business, design, and more.
        </p>
        <form onSubmit={handleSearch} className="mt-8 max-w-3xl mx-auto" data-testid="form-search">
          <div className="relative">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 text-lg text-gray-800 bg-white border-2 border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Try: python, data science, marketing, devops"
              data-testid="input-search"
            />
            <Button
              type="submit"
              className="absolute top-1/2 right-2 -translate-y-1/2 px-6 py-2.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full"
              data-testid="button-search"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Trending Topics */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {trendingTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSearchQuery(topic)}
              className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
            >
              #{topic}
            </button>
          ))}
        </div>
      </section>

      {/* Category Filters */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {featuredCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full border text-sm ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <HomeGroups />

      {/* Webinar Listings */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-listings-title">
            {searchQuery
              ? `Search: "${searchQuery}"`
              : selectedCategory
              ? `${selectedCategory} Webinars`
              : 'Featured Upcoming Webinars'}
          </h2>
          <span className="text-sm text-gray-500">{isLoading ? 'Loading…' : `${webinars.length} results`}</span>
        </div>

        {isLoading ? (
          <div className="grid mt-8 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid mt-8 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="grid-webinars">
            {webinars.length > 0 ? (
              webinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600 py-8" data-testid="text-no-results">
                {searchQuery || selectedCategory ? 'No webinars found matching your filters.' : 'No webinars available.'}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white border rounded-2xl p-8">
        <div className="md:flex md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Stay in the loop</h3>
            <p className="text-gray-600 mt-1">Get a weekly digest of top upcoming webinars across categories.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Subscribed! (demo)');
            }}
            className="mt-4 md:mt-0 flex gap-3"
          >
            <Input type="email" placeholder="you@example.com" className="w-64" required />
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
