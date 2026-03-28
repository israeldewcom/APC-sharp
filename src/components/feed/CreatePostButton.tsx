// src/components/feed/CreatePostButton.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Image, Video, Calendar } from 'lucide-react';
import api from '@/lib/api/client';
import { useMediaUpload } from '@/hooks/useMediaUpload';
//import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  privacy: z.enum(['public', 'followers', 'close_friends']).default('public'),
  schedule: z.string().optional(),
});

type PostForm = z.infer<typeof postSchema>;

interface CreatePostButtonProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePostButton({ isOpen, onClose, onSuccess }: CreatePostButtonProps) {
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const { files, getRootProps, getInputProps, isDragActive, uploadFiles, removeFile, clearFiles } = useMediaUpload();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
      privacy: 'public',
      schedule: '',
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostForm & { mediaUrls: string[] }) => {
      const payload: any = {
        content: data.content,
        privacy: data.privacy,
      };
      if (data.mediaUrls.length) payload.media = data.mediaUrls;
      if (scheduleEnabled && data.schedule) payload.scheduled_at = data.schedule;
      return api.post('/posts/', payload);
    },
    onSuccess: () => {
      toast.success('Post created successfully');
      reset();
      clearFiles();
      setScheduleEnabled(false);
      onClose();
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    },
  });

  const onSubmit = async (data: PostForm) => {
    let mediaUrls: string[] = [];
    if (files.length > 0) {
      try {
        mediaUrls = await uploadFiles();
      } catch (err) {
        toast.error('Failed to upload media');
        return;
      }
    }
    createPostMutation.mutate({ ...data, mediaUrls });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            className="min-h-[120px]"
            {...register('content')}
          />
          {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}

          {/* Media Upload */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center space-x-4">
              <Image className="w-6 h-6 text-gray-500" />
              <Video className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Add Photos/Videos</p>
          </div>

          {/* Media Previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  {file.type === 'image' ? (
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover rounded" />
                  ) : (
                    <video src={file.preview} className="w-full h-full object-cover rounded" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <Label>Visibility</Label>
            <Select onValueChange={(val) => setValue('privacy', val as any)} defaultValue="public">
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Public" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="close_friends">Close friends</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div className="flex items-center justify-between">
            <Label>Schedule (optional)</Label>
            <div className="flex items-center space-x-2">
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          {scheduleEnabled && (
            <Input type="datetime-local" {...register('schedule')} />
          )}

          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
<button type="submit" disabled={createPostMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  {createPostMutation.isPending ? 'Publishing...' : 'Publish'}
</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
