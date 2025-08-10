import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

type Blog = {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

export default function Blog() {
  const [q, setQ] = useState('');
  const { data: posts = [], isLoading } = useQuery<Blog[]>({ queryKey: ['/api/blog'] });
  const filtered = useMemo(() => posts.filter(p => p.title.toLowerCase().includes(q.toLowerCase())), [posts, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Insights & Guides</h1>
        <Input placeholder="Search posts" value={q} onChange={(e) => setQ(e.target.value)} className="w-72 ml-auto" />
      </div>
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
              <p className="mt-2 text-gray-700 line-clamp-3">{p.content.slice(0, 240)}…</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
