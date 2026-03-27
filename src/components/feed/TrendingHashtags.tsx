'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TrendingHashtags() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: () => api.get('/hashtags/trending/').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Trending</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Trending Hashtags</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {trending?.map((tag) => (
          <Link key={tag.name} href={`/explore?tag=${tag.name}`} className="block text-primary hover:underline text-sm">
            #{tag.name} · {tag.post_count} posts
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
