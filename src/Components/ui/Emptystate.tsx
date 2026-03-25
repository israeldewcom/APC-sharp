// src/components/ui/EmptyState.tsx (New)
'use client';

import { motion } from 'framer-motion';
import { Search, Users, MessageSquare, Heart, Camera, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: 'search' | 'users' | 'message' | 'heart' | 'camera' | 'error' | 'feed';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  search: Search,
  users: Users,
  message: MessageSquare,
  heart: Heart,
  camera: Camera,
  error: AlertCircle,
  feed: Inbox,
};

export function EmptyState({ icon = 'feed', title, description, action }: EmptyStateProps) {
  const IconComponent = icons[icon];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <IconComponent className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
