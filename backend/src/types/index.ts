export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  profilePicture?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coach extends User {
  bio?: string;
  experience: number; // years of experience
  specializations: string[];
  certifications: string[];
  hourlyRate?: number;
  location: string;
  availableTimeSlots: TimeSlot[];
  rating: number;
  totalReviews: number;
  sportsPlayed: string[];
  isVerified: boolean;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

export enum UserRole {
  USER = 'user',
  COACH = 'coach',
  ADMIN = 'admin'
}

export interface CreateCoachRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bio?: string;
  experience: number;
  specializations: string[];
  certifications: string[];
  hourlyRate?: number;
  location: string;
  sportsPlayed: string[];
}

export interface UpdateCoachRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  experience?: number;
  specializations?: string[];
  certifications?: string[];
  hourlyRate?: number;
  location?: string;
  sportsPlayed?: string[];
}

export interface CoachFilters {
  page?: number;
  limit?: number;
  verified?: boolean;
  sport?: string;
  location?: string;
  minRating?: number;
  maxHourlyRate?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | object;
  message?: string;
  timestamp: string;
}
