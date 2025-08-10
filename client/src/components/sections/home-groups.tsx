import { useQuery } from '@tanstack/react-query';
import { Webinar } from '@shared/types';
import { WebinarCard } from '@/components/webinar-card';

export function HomeGroups() {
  const { data: happeningNow = [] } = useQuery<Webinar[]>({ queryKey: ['/api/webinars/happening-now'] });
  const { data: happeningToday = [] } = useQuery<Webinar[]>({ queryKey: ['/api/webinars/happening-today'] });
  const { data: recentSearches = [] } = useQuery<{ query: string; created_at: string }[]>({ queryKey: ['/api/searches/recent'] });
  const { data: groupedByCategory = {} as Record<string, Webinar[]> } = useQuery<Record<string, Webinar[]>>({ queryKey: ['/api/webinars/grouped/category'] });

  return (
    <div className="space-y-12">
      {happeningNow.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Happening Now</h2>
          <div className="grid mt-4 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {happeningNow.map((w) => <WebinarCard key={w.id} webinar={w} />)}
          </div>
        </section>
      )}

      {happeningToday.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Happening Today</h2>
          <div className="grid mt-4 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {happeningToday.map((w) => <WebinarCard key={w.id} webinar={w} />)}
          </div>
        </section>
      )}

      {recentSearches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Last searched by users</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <span key={`${s.query}-${s.created_at}`} className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 border border-gray-200">{s.query}</span>
            ))}
          </div>
        </section>
      )}

      {Object.keys(groupedByCategory).length > 0 && (
        <section>
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <div className="mt-4 space-y-8">
            {Object.entries(groupedByCategory).map(([cat, list]) => (
              <div key={cat}>
                <h3 className="text-lg font-semibold text-gray-800">{cat}</h3>
                <div className="grid mt-3 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.slice(0, 8).map((w) => <WebinarCard key={w.id} webinar={w} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
