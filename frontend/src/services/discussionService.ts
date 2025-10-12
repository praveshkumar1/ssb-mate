import apiClient from './api';

export interface LiveDiscussionAttendee {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profileImageUrl?: string;
}

export interface LiveDiscussion {
  _id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  capacity: number;
  meetLink: string;
  attendees: (string | LiveDiscussionAttendee)[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const discussionService = {
  list: async (): Promise<LiveDiscussion[]> => {
    return apiClient.get<LiveDiscussion[]>('/discussions');
  },
  join: async (id: string): Promise<{ status: string }> => {
    return apiClient.post<{ status: string }>(`/discussions/${id}/join`);
  },
  access: async (id: string): Promise<{ meetLink: string }> => {
    return apiClient.get<{ meetLink: string }>(`/discussions/${id}/access`);
  },
  adminCreate: async (payload: {
    title: string;
    description?: string;
    startTime: string; // ISO
    capacity?: number;
    meetLink: string;
  }): Promise<LiveDiscussion> => {
    return apiClient.post<LiveDiscussion>('/discussions/admin', payload);
  }
};

export default discussionService;
