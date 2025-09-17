export interface User {
  id: string;
  name: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  bio?: string;
  profileImageUrl?: string;
  phone?: string;
  location?: string;
  experience?: 'entry_level' | 'experienced' | 'senior' | number;
  experienceLevel?: 'entry_level' | 'experienced' | 'senior';
  specializations: string[];
  certifications: string[];
  rating: number;
  totalReviews: number;
  hourlyRate?: number;
  availability?: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Backend compatibility fields
  firstName?: string;
  lastName?: string;
}

export interface Coach extends User {
  role: 'mentor';
}

// Keep the old Role interface for backward compatibility
export interface Role {
  id: number;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: 'mentor' | 'mentee';
}

export interface JwtResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  timestamp: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  timestamp: string;
}
