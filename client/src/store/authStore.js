import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  ws: null,

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
      get().connectWebSocket();
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  login: async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token });
      get().connectWebSocket();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed',
        requires2FA: error.response?.data?.requires2FA 
      };
    }
  },

  register: async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token });
      get().connectWebSocket();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}

    const ws = get().ws;
    if (ws) ws.close();

    localStorage.removeItem('token');
    set({ user: null, token: null, ws: null });
  },

  connectWebSocket: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = API_URL.replace('http', 'ws').replace('/api', '/ws');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      const user = get().user;
      if (user) {
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
      if (data.type === 'new_message') {
        // Update messages store
      } else if (data.type === 'typing') {
        // Update typing status
      } else if (data.type === 'user_status') {
        // Update user online status
      } else if (data.type === 'reaction') {
        // Update reactions
      }
    };

    ws.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => get().connectWebSocket(), 5000);
    };

    set({ ws });
  },

  updateProfile: async (data) => {
    try {
      const { data: user } = await api.put('/auth/profile', data);
      set({ user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  }
}));

export { api };
