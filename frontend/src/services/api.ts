import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'אירעה שגיאה';
    toast({
      variant: 'destructive',
      title: 'שגיאה',
      description: Array.isArray(message) ? message.join(', ') : message,
    });
    return Promise.reject(error);
  }
);
