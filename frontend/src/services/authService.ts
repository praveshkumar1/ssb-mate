import { apiClient } from './api';
import { LoginRequest, SignupRequest, JwtResponse } from '@/types';

export const authService = {
  // Register new user
  register: (userData: SignupRequest): Promise<JwtResponse> => {
    return apiClient.post<JwtResponse>('/auth/register', userData);
  },

  // Login user
  login: (credentials: LoginRequest): Promise<JwtResponse> => {
    return apiClient.post<JwtResponse>('/auth/login', credentials);
  },

  // Logout user (client-side token removal)
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Get current user data
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Store token and user data
  storeAuthData: (token: string, user: any): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Check if user is a mentor
  isMentor: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'mentor';
  },

  // Add authorization header to requests
  getAuthHeaders: () => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authService;
