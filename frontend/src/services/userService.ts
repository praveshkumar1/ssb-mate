import { apiClient } from './api';

export const userService = {
  getProfile: (): Promise<any> => apiClient.get('/users/profile'),
  updateProfile: (payload: any): Promise<any> => apiClient.put('/users/profile', payload),
  getAllUsers: (params?: any) => apiClient.get('/users')
};

export default userService;
