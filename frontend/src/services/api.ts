import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'שגיאה בתקשורת עם השרת';
    toast({
      variant: 'destructive',
      title: 'שגיאה',
      description: Array.isArray(message) ? message.join(', ') : message,
    });
    return Promise.reject(error);
  }
);
