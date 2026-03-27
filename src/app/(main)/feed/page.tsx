'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { PostCard } from '@/components/feed/PostCard';
import { StoryRow } from '@/components/feed/StoryRow';
import { CreatePostButton } from '@/components/feed/CreatePostButton';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { TrendingHashtags } from '@/components/feed/TrendingHashtags';
import { Suggestions } from '@/components/feed/Suggestions';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FeedPage() {
  const { user } = useAuthStore();
  const { ref, inView } = useInView();
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Fetch stories
  const { data: stories } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get('/stories/').then((res) => res.data),
  });

  // Infinite feed query (React Query v5 syntax)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/posts/feed/?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    initialPageParam: 1,
    staleTime: 30000,
    gcTime: 300000, // formerly cacheTime
  });

  // Load more when scrolling into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (status === 'pending') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4 h-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div className="h-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <EmptyState
        icon="error"
        title="Unable to load feed"
        description="There was an error loading your feed. Please try again."
        action={{
          label: 'Retry',
          onClick: () => refetch(),
        }}
      />
    );
  }

  const posts = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories */}
          <StoryRow stories={stories} />

          {/* Feed Posts */}
          <AnimatePresence>
            {posts.length === 0 ? (
              <EmptyState
                icon="feed"
                title="No posts yet"
                description="Follow users or create your first post to see content here."
                action={{
                  label: 'Create Post',
                  onClick: () => setShowCreatePost(true),
                }}
              />
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Load more skeleton */}
          {isFetchingNextPage && (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Intersection observer target */}
          <div ref={ref} className="h-10" />
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-6">
            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{user?.name}</h3>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
                <button className="text-primary text-sm font-semibold">Switch</button>
              </div>
            </div>

            {/* Trending Hashtags */}
            <TrendingHashtags />

            {/* Suggestions */}
            <Suggestions />
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <CreatePostButton
            isOpen={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onSuccess={() => {
              refetch();
              setShowCreatePost(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
