// src/components/feed/CommentsList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import api from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CommentsList({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await api.get(`/posts/${postId}/comments/`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments?.map((comment: any) => (
        <div key={comment.id} className="flex space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user.avatar} />
            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
              <Link href={`/${comment.user.username}`} className="font-semibold text-sm hover:underline">
                {comment.user.name}
              </Link>
              <p className="text-sm mt-0.5">{comment.content}</p>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              <button className="hover:underline">Like</button>
              <button className="hover:underline">Reply</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
