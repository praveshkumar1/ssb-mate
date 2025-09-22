import { apiClient } from './api';

export interface Session {
  _id: string;
  title: string;
  description?: string;
  mentorId: string;
  menteeId: string;
  sessionType: string;
  duration: number;
  scheduledAt: string;
  meetingLink?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const sessionService = {
  getAllSessions: (): Promise<Session[]> => apiClient.get<Session[]>('/sessions'),
  getSessions: (query?: Record<string, any>): Promise<Session[]> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    return apiClient.get<Session[]>(`/sessions${qs ? `?${qs}` : ''}`);
  },
  getSessionById: (id: string): Promise<Session> => apiClient.get<Session>(`/sessions/${id}`),
  createSession: (payload: any): Promise<Session> => apiClient.post<Session>('/sessions', payload),
  updateSession: (id: string, payload: any): Promise<Session> => apiClient.put<Session>(`/sessions/${id}`, payload),
  deleteSession: (id: string): Promise<any> => apiClient.delete(`/sessions/${id}`),
};

export default sessionService;
