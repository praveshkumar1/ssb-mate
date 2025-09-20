import { apiClient } from './api';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'interview_tips' | 'preparation_guide' | 'assessment_format' | 'success_stories' | 'mock_tests' | 'video_tutorials';
  authorId: string;
  tags: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  isPublic: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  createdAt: string;
  updatedAt: string;
}

export const resourceService = {
  // Get all resources
  getAllResources: (): Promise<Resource[]> => {
    return apiClient.get<Resource[]>('/resources');
  },

  // Get resources by category
  getResourcesByCategory: (category: string): Promise<Resource[]> => {
    return apiClient.get<Resource[]>(`/resources/by-category/${category}`);
  },

  // Get resource by ID
  getResourceById: (id: string): Promise<Resource> => {
    return apiClient.get<Resource>(`/resources/${id}`);
  },

  // Create resource
  createResource: (payload: any): Promise<Resource> => {
    return apiClient.post<Resource>('/resources', payload);
  },

  // Search resources
  searchResources: (query: string): Promise<Resource[]> => {
    return apiClient.get<Resource[]>(`/resources/search?q=${encodeURIComponent(query)}`);
  },
};

export default resourceService;
