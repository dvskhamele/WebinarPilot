import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Webinar } from '@shared/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/constants';
import { WebinarCard } from '@/components/webinar-card';

export default function Explore() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<'date' | 'recent'>('date');

  const apiUrl = useMemo(() => {
    if (q.trim().length > 0) return `/api/webinars/search?q=${encodeURIComponent(q.trim())}`;
    if (category) return `/api/webinars/category/${encodeURIComponent(category)}`;
    return '/api/webinars';
  }, [q, category]);

  const { data: webinars = [], isLoading } = useQuery<Webinar[]>({ queryKey: [apiUrl] });

  const sorted = useMemo(() => {
    const copy = [...webinars];
    if (sort === 'date') {
      copy.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else {
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return copy;
  }, [webinars, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search topics" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
        <Select onValueChange={(v) => setCategory(v)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="recent">Recently Added</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500 ml-auto">{isLoading ? 'Loading…' : `${webinars.length} results`}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((w) => <WebinarCard key={w.id} webinar={w} />)}
      </div>
    </div>
  );
}
