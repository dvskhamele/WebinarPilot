import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WebinarCard } from '@/components/webinar-card';
import { Webinar } from '@shared/types';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: webinars = [], isLoading } = useQuery<Webinar[]>({
    queryKey: ['/api/webinars'],
  });

  const filteredWebinars = webinars.filter(webinar =>
    webinar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webinar.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webinar.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filtering, no need for additional action
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Find Your Next <span className="text-indigo-600">Learning</span> Opportunity
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
          Instantly search for free, live workshops on any topic from across the web.
        </p>
        <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto" data-testid="form-search">
          <div className="relative">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 text-lg text-gray-800 bg-white border-2 border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 'live python workshop for beginners'"
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
      </section>

      {/* Webinar Listings */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 text-center" data-testid="text-listings-title">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Upcoming Webinars'}
        </h2>
        
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
            {filteredWebinars.length > 0 ? (
              filteredWebinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600 py-8" data-testid="text-no-results">
                {searchQuery ? 'No webinars found matching your search.' : 'No webinars available.'}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
