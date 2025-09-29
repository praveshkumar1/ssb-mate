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
  getCoachById: (id: string): Promise<Coach> => {
    return apiClient.get<Coach>(`/coaches/${id}`);
  },

  // Search coaches
  searchCoaches: (params: {
    specialization?: string;
    minRating?: number;
    location?: string;
    experience?: string;
    query?: string;
  }): Promise<Coach[]> => {
    const searchParams = new URLSearchParams();
    
    if (params.specialization) searchParams.append('specialization', params.specialization);
    if (params.minRating) searchParams.append('minRating', params.minRating.toString());
    if (params.location) searchParams.append('location', params.location);
    if (params.experience) searchParams.append('experience', params.experience);
    if (params.query) searchParams.append('query', params.query);
    
    return apiClient.get<Coach[]>(`/coaches/search?${searchParams.toString()}`);
  },

  // Get top rated coaches
  getTopRatedCoaches: (limit?: number): Promise<Coach[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get<Coach[]>(`/coaches/top-rated${params}`);
  },

  // Get featured mentors (prefer featured, fill with top-rated)
  getFeaturedMentors: (limit?: number): Promise<Coach[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get<Coach[]>(`/coaches/featured${params}`);
  },
};

export default coachService;
