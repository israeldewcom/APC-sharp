// src/components/feed/PostCard.tsx (Enhanced with interactions, sharing, and animations)
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api/client';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Smile, Trash2, Edit2, Flag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PostCardProps {
  post: any;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function PostCard({ post, onDelete, onEdit }: PostCardProps) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comment, setComment] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const likeMutation = useMutation(
    () => api.post(`/posts/${post.id}/like/`),
    {
      onMutate: async () => {
        await queryClient.cancelQueries(['feed']);
        setLiked(!liked);
        setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
      },
      onError: () => {
        setLiked(liked);
        setLikesCount(likesCount);
        toast.error('Failed to like post');
      },
    }
  );
  
  const saveMutation = useMutation(
    () => api.post(`/posts/${post.id}/save/`),
    {
      onMutate: () => {
        setSaved(!saved);
        toast.success(saved ? 'Removed from saved' : 'Saved to collection');
      },
      onError: () => {
        setSaved(saved);
        toast.error('Failed to save post');
      },
    }
  );
  
  const commentMutation = useMutation(
    () => api.post(`/posts/${post.id}/comments/`, { content: comment }),
    {
      onSuccess: () => {
        setComment('');
        queryClient.invalidateQueries(['comments', post.id]);
        toast.success('Comment added');
      },
      onError: () => {
        toast.error('Failed to add comment');
      },
    }
  );
  
  const deleteMutation = useMutation(
    () => api.delete(`/posts/${post.id}/`),
    {
      onSuccess: () => {
        toast.success('Post deleted');
        onDelete?.();
        queryClient.invalidateQueries(['feed']);
      },
      onError: () => {
        toast.error('Failed to delete post');
      },
    }
  );
  
  const reportMutation = useMutation(
    (reason: string) => api.post(`/posts/${post.id}/report/`, { reason }),
    {
      onSuccess: () => {
        toast.success('Post reported. We\'ll review it shortly.');
        setShowReportDialog(false);
      },
      onError: () => {
        toast.error('Failed to report post');
      },
    }
  );
  
  const handleLike = () => {
    likeMutation.mutate();
  };
  
  const handleSave = () => {
    saveMutation.mutate();
  };
  
  const handleComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate();
  };
  
  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };
  
  const handleReport = (reason: string) => {
    reportMutation.mutate(reason);
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.content.substring(0, 100),
        text: `Check out this post from ${post.user.name}`,
        url: `${window.location.origin}/posts/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      toast.success('Link copied to clipboard');
    }
    setShowShareMenu(false);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/${post.user.username}`}>
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/${post.user.username}`}>
                <h3 className="font-semibold hover:underline">{post.user.name}</h3>
              </Link>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.id === post.user.id ? (
                <>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Post Content */}
        <div className="px-4 pb-2">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/explore?tag=${tag}`}
                  className="text-primary hover:underline text-sm"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Post Media */}
        {post.media && post.media.length > 0 && (
          <div className="mt-2">
            {post.media.length === 1 ? (
              <div className="relative aspect-video">
                <Image
                  src={post.media[0]}
                  alt="Post media"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={`grid gap-1 ${post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
                {post.media.slice(0, 4).map((media: string, idx: number) => (
                  <div key={idx} className="relative aspect-square">
                    <Image
                      src={media}
                      alt={`Post media ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    {idx === 3 && post.media.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">+{post.media.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Post Actions */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={liked ? 'text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 mr-1 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowComments(!showComments);
                  setTimeout(() => commentInputRef.current?.focus(), 100);
                }}
              >
                <MessageCircle className="h-5 w-5 mr-1" />
                <span>{post.comments_count}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowShareMenu(true)}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-700"
            >
              <div className="p-4">
                <CommentsList postId={post.id} />
                <div className="mt-3 flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleComment}
                      disabled={!comment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Share Menu Dialog */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this post</DialogTitle>
            <DialogDescription>
              Share this post with your friends and followers
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-4 py-4">
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Why are you reporting this post?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {['Spam', 'Harassment', 'Hate speech', 'Violence', 'Misinformation', 'Other'].map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReport(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Comments List Component
function CommentsList({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useQuery(['comments', postId], () =>
    api.get(`/posts/${postId}/comments/`).then((res) => res.data)
  );
  
  if (isLoading) {
    return <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>;
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
