// src/store/syncStore.ts (New)
import { create } from 'zustand';
import { db } from '@/lib/storage/db';
import { getPendingItems, markAsSynced, markAsFailed, addToQueue } from '@/lib/storage/syncQueue';
import api from '@/lib/api/client';
import { useAuthStore } from './authStore';

interface SyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  pendingCount: number;
  startSync: () => void;
  stopSync: () => void;
  syncNow: () => Promise<void>;
  syncOfflineMessages: () => Promise<void>;
  addToSyncQueue: (type: string, payload: any) => Promise<void>;
}

let syncInterval: NodeJS.Timeout | null = null;

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  lastSync: null,
  pendingCount: 0,
  
  startSync: () => {
    if (syncInterval) return;
    
    // Initial sync
    get().syncNow();
    
    // Sync every 30 seconds
    syncInterval = setInterval(() => {
      get().syncNow();
    }, 30000);
  },
  
  stopSync: () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },
  
  syncNow: async () => {
    const { isSyncing, syncOfflineMessages } = get();
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated || isSyncing) return;
    
    set({ isSyncing: true });
    
    try {
      await syncOfflineMessages();
      
      // Sync other operations
      const pending = await getPendingItems();
      set({ pendingCount: pending.length });
      
      for (const item of pending) {
        try {
          switch (item.type) {
            case 'createPost':
              await api.post('/posts/', item.payload);
              break;
            case 'updatePost':
              await api.patch(`/posts/${item.payload.id}/`, item.payload);
              break;
            case 'deletePost':
              await api.delete(`/posts/${item.payload.id}/`);
              break;
            case 'sendMessage':
              await api.post(`/messages/${item.payload.chatId}/send/`, {
                content: item.payload.content,
                tempId: item.payload.tempId,
              });
              break;
            case 'like':
              await api.post(`/posts/${item.payload.postId}/like/`);
              break;
            case 'comment':
              await api.post(`/posts/${item.payload.postId}/comments/`, {
                content: item.payload.content,
              });
              break;
            case 'follow':
              await api.post(`/users/${item.payload.userId}/follow/`);
              break;
          }
          await markAsSynced(item.id);
        } catch (err: any) {
          await markAsFailed(item.id, err.message);
          console.error(`Failed to sync ${item.type}:`, err);
        }
      }
      
      set({ lastSync: new Date() });
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
  
  syncOfflineMessages: async () => {
    const offlineMessages = await db.offlineMessages.toArray();
    
    for (const message of offlineMessages) {
      try {
        await api.post(`/messages/${message.chatId}/send/`, {
          content: message.content,
          tempId: message.tempId,
        });
        await db.offlineMessages.delete(message.id);
      } catch (error) {
        console.error('Failed to send offline message:', error);
      }
    }
  },
  
  addToSyncQueue: async (type, payload) => {
    await addToQueue(type, payload);
    const pending = await getPendingItems();
    set({ pendingCount: pending.length });
    
    // Try to sync immediately if online
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && navigator.onLine) {
      get().syncNow();
    }
  },
}));
