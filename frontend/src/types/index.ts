export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
}

export interface Coach {
  id: number;
  user: User;
  specialty: string;
  experience?: string;
  hourlyRate?: number;
  availability?: string;
  rating?: number;
  totalReviews?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  certifications?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role?: string[];
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface MessageResponse {
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status: string;
}
