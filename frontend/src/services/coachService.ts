import { apiClient } from './api';
import { Coach } from '@/types';

export const coachService = {
  // Get all coaches
  getAllCoaches: (): Promise<Coach[]> => {
    return apiClient.get<Coach[]>('/coaches');
  },

  // Get verified coaches only
  getVerifiedCoaches: (): Promise<Coach[]> => {
    return apiClient.get<Coach[]>('/coaches/verified');
  },

  // Get coach by ID
  getCoachById: (id: number): Promise<Coach> => {
    return apiClient.get<Coach>(`/coaches/${id}`);
  },

  // Search coaches by specialty
  searchCoachesBySpecialty: (specialty: string): Promise<Coach[]> => {
    return apiClient.get<Coach[]>(`/coaches/search?specialty=${encodeURIComponent(specialty)}`);
  },

  // Create new coach
  createCoach: (coach: Partial<Coach>): Promise<Coach> => {
    return apiClient.post<Coach>('/coaches', coach);
  },

  // Update coach
  updateCoach: (id: number, coach: Partial<Coach>): Promise<Coach> => {
    return apiClient.put<Coach>(`/coaches/${id}`, coach);
  },

  // Delete coach
  deleteCoach: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/coaches/${id}`);
  },
};

export default coachService;
