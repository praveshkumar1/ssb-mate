// Enhanced User and Authentication Types
export interface User {
  id: string;
  email: string;
  password?: string; // Only for creation, not returned
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
  experienceYears?: number;
  specializations: string[];
  rank?: string;
  unit?: string;
  achievements: string[];
  hourlyRate?: number;
  availability: string[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  COACH = 'coach',
  ADMIN = 'admin'
}

export interface UserCreate {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserProfile {
  bio?: string;
  experienceYears?: number;
  specializations?: string[];
  rank?: string;
  unit?: string;
  achievements?: string[];
  hourlyRate?: number;
  availability?: string[];
  profileImageUrl?: string;
}

export interface Token {
  accessToken: string;
  tokenType: string;
  user: Omit<User, 'password'>;
}

// Session Types
export interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description?: string;
  sessionType: SessionType;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  meetingLink?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export enum SessionType {
  MOCK_INTERVIEW = 'mock_interview',
  GUIDANCE = 'guidance',
  ASSESSMENT = 'assessment',
  GROUP_DISCUSSION = 'group_discussion',
  PSYCHOLOGY_TEST = 'psychology_test'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export interface SessionCreate {
  mentorId: string;
  title: string;
  description?: string;
  sessionType: SessionType;
  scheduledAt: string;
  durationMinutes?: number;
}

export interface SessionUpdate {
  notes?: string;
  rating?: number;
  feedback?: string;
  status?: SessionStatus;
  meetingLink?: string;
}

// Resource Types
export interface Resource {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: ResourceCategory;
  authorId: string;
  tags: string[];
  isPublic: boolean;
  downloadUrl?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ResourceCategory {
  INTERVIEW_TIPS = 'interview_tips',
  PREPARATION_GUIDE = 'preparation_guide',
  ASSESSMENT_FORMAT = 'assessment_format',
  PSYCHOLOGY_TESTS = 'psychology_tests',
  GROUP_DISCUSSION = 'group_discussion',
  CURRENT_AFFAIRS = 'current_affairs'
}

export interface ResourceCreate {
  title: string;
  description?: string;
  content: string;
  category: ResourceCategory;
  tags?: string[];
  isPublic?: boolean;
}

// Assessment Types
export interface Assessment {
  id: string;
  sessionId: string;
  assessorId: string;
  candidateId: string;
  assessmentType: AssessmentType;
  scores: AssessmentScore[];
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedFeedback: string;
  createdAt: string;
  updatedAt: string;
}

export enum AssessmentType {
  OIR = 'oir', // Officer Intelligence Rating
  PPDT = 'ppdt', // Picture Perception and Discussion Test
  TAT = 'tat', // Thematic Apperception Test
  WAT = 'wat', // Word Association Test
  SRT = 'srt', // Situation Reaction Test
  GTO = 'gto', // Group Testing Officer
  PERSONAL_INTERVIEW = 'personal_interview'
}

export interface AssessmentScore {
  parameter: string;
  score: number;
  maxScore: number;
  comments?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export enum NotificationType {
  SESSION_REMINDER = 'session_reminder',
  SESSION_CANCELLED = 'session_cancelled',
  NEW_RESOURCE = 'new_resource',
  ASSESSMENT_READY = 'assessment_ready',
  SYSTEM_UPDATE = 'system_update'
}

// Legacy Coach types for backward compatibility
export interface Coach extends User {
  // Legacy properties
  specialty?: string;
  experience?: string;
  certifications?: string[];
  location?: string;
  sportsPlayed?: string[];
  totalReviews?: number;
  rating?: number;
  
  // TimeSlot compatibility
  availableTimeSlots?: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
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

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}
