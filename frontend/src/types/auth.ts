export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'admin' | 'viewer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
