// src/components/feed/StoryRow.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import api from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function StoryRow() {
  const { data: stories, isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const response = await api.get('/stories/');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  // Hardcoded example users for story preview (replace with real data)
  const storyUsers = stories?.slice(0, 10) || [
    { id: '1', name: 'Ahmed', avatar: null },
    { id: '2', name: 'Ngozi', avatar: null },
    { id: '3', name: 'Fatima', avatar: null },
  ];

  // Helper for button styling (matching shadcn outline)
  const btnOutlineClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex-shrink-0 text-center">
          <button
            className={`${btnOutlineClasses} relative w-16 h-16 rounded-full p-0 border-2 border-primary`}
            onClick={() => {/* open story creator */}}
          >
            <Plus className="w-6 h-6" />
          </button>
          <p className="text-xs mt-1">Add Story</p>
        </div>

        {/* Story Avatars */}
        {storyUsers.map((user: any) => (
          <Link key={user.id} href={`/stories/${user.id}`} className="flex-shrink-0 text-center">
            <div className="relative w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2">
              <Avatar className="w-full h-full">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-xs mt-1 truncate w-16">{user.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
