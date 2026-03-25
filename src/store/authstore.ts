// src/store/authStore.ts (Enhanced)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api/client';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '@/lib/api/auth';
import { initSocket, closeSocket } from '@/lib/websocket/socket';
import toast from 'react-hot-toast';
import { useSyncStore } from './syncStore';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorRequired: boolean;
  twoFactorToken: string | null;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  sendTwoFactorCode: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      twoFactorRequired: false,
      twoFactorToken: null,
      
      login: async (email, password, twoFactorCode) => {
        set({ isLoading: true });
        try {
          const response = await apiLogin(email, password, twoFactorCode);
          
          if (response.two_factor_required) {
            set({ twoFactorRequired: true, twoFactorToken: response.two_factor_token });
            toast.success('Please enter your 2FA code');
            return;
          }
          
          const userRes = await api.get('/auth/me/');
          set({ user: userRes.data, isAuthenticated: true, twoFactorRequired: false });
          
          // Initialize socket connection
          initSocket();
          
          // Start sync service
          const { startSync } = useSyncStore.getState();
          startSync();
          
          toast.success('Welcome back!');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Login failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      register: async (data) => {
        set({ isLoading: true });
        try {
          await apiRegister(data);
          toast.success('Registration successful! Please verify your email.');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Registration failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await apiLogout();
          closeSocket();
          set({ user: null, isAuthenticated: false });
          
          // Stop sync service
          const { stopSync } = useSyncStore.getState();
          stopSync();
          
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchUser: async () => {
        try {
          const res = await api.get('/auth/me/');
          set({ user: res.data, isAuthenticated: true });
          
          // Initialize socket if user is authenticated
          if (res.data) {
            initSocket();
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
      
      verifyTwoFactor: async (code) => {
        const { twoFactorToken } = get();
        if (!twoFactorToken) return;
        
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/2fa/verify/', {
            token: twoFactorToken,
            code,
          });
          
          const userRes = await api.get('/auth/me/');
          set({ user: userRes.data, isAuthenticated: true, twoFactorRequired: false });
          
          initSocket();
          toast.success('2FA verification successful');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Invalid 2FA code');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      sendTwoFactorCode: async () => {
        try {
          await api.post('/auth/2fa/send/');
          toast.success('2FA code sent to your email');
        } catch (error: any) {
          toast.error('Failed to send 2FA code');
          throw error;
        }
      },
      
      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.patch('/auth/profile/', data);
          set({ user: response.data });
          toast.success('Profile updated successfully');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to update profile');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      changePassword: async (oldPassword, newPassword) => {
        set({ isLoading: true });
        try {
          await api.post('/auth/change-password/', { oldPassword, newPassword });
          toast.success('Password changed successfully');
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to change password');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
