// src/lib/websocket/socket.ts (Enhanced)
import { io, Socket } from 'socket.io-client';
import { getToken } from '../api/auth';
import { useSyncStore } from '@/store/syncStore';
import toast from 'react-hot-toast';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const initSocket = () => {
  if (socket?.connected) return socket;
  
  const token = getToken();
  if (!token) return null;
  
  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
    reconnectAttempts = 0;
    
    // Sync offline messages after reconnection
    const { syncOfflineMessages } = useSyncStore.getState();
    syncOfflineMessages();
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    
    if (reason === 'io server disconnect') {
      // Server disconnected, attempt to reconnect
      socket?.connect();
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      toast.error('Unable to connect to real-time server. Please refresh the page.');
    }
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
    toast.error('Real-time connection error');
  });
  
  // Handle incoming messages
  socket.on('new_message', (data) => {
    const { addMessage } = useChatStore.getState();
    addMessage(data);
  });
  
  // Handle notifications
  socket.on('notification', (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification(data);
    
    // Show toast for important notifications
    if (data.type === 'message' || data.type === 'mention') {
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <img src={data.user.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="font-semibold">{data.user.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{data.content}</p>
            </div>
          </div>
        </div>
      ));
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { setTyping } = useChatStore.getState();
    setTyping(data.chatId, data.userId, data.isTyping);
  });
  
  // Handle presence updates
  socket.on('presence_update', (data) => {
    const { updateUserPresence } = usePresenceStore.getState();
    updateUserPresence(data.userId, data.status);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Emit typing event
export const emitTyping = (chatId: string, isTyping: boolean) => {
  if (socket?.connected) {
    socket.emit('typing', { chatId, isTyping });
  }
};

// Emit read receipt
export const emitReadReceipt = (messageId: string, chatId: string) => {
  if (socket?.connected) {
    socket.emit('read_receipt', { messageId, chatId });
  }
};
