'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Suggestions() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/users/suggestions/').then((res) => res.data),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Who to follow</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-gray-200 rounded-full" /><div className="h-4 w-24 bg-gray-200 rounded" /></div>
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!suggestions?.length) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Who to follow</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 5).map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <Link href={`/${user.username}`} className="flex items-center space-x-2">
              <Avatar className="w-8 h-8"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
              <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-500">@{user.username}</p></div>
            </Link>
            <Button variant="outline" size="sm">Follow</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
