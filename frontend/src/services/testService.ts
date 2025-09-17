import { apiClient } from './api';

export interface HealthResponse {
  status: string;
  timestamp: number;
  service: string;
}

export interface HelloResponse {
  message: string;
  status: string;
}

export const testService = {
  // Test backend connection
  hello: (): Promise<HelloResponse> => {
    return apiClient.get<HelloResponse>('/test/hello');
  },

  // Check backend health
  health: (): Promise<HealthResponse> => {
    return apiClient.get<HealthResponse>('/test/health');
  },

  // Test POST endpoint
  echo: (data: any): Promise<any> => {
    return apiClient.post('/test/echo', data);
  },
};

export default testService;
