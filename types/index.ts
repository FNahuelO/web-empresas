export interface User {
  id: string;
  email: string;
  role: 'EMPRESA' | 'POSTULANTE';
  companyName?: string;
}

export interface EmpresaProfile {
  id: string;
  companyName: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  logo?: string;
  descripcion?: string;
  sector?: string;
  industria?: string;
  sitioWeb?: string;
  email?: string;
  phone?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  benefits?: string;
  location?: string;
  ciudad?: string;
  provincia?: string;
  estado?: string;
  jobType?: string;
  workMode?: string;
  modality?: string;
  category?: string;
  experienceLevel?: string;
  status: string;
  moderationStatus?: string;
  moderationReason?: string;
  autoRejectionReason?: string;
  schedule?: string;
  publishedAt?: string;
  fechaPublicacion?: string;
  salarioMin?: number;
  salarioMax?: number;
  minSalary?: number;
  maxSalary?: number;
  moneda?: string;
  empresa?: EmpresaProfile | string;
  _count?: {
    applications?: number;
  };
  // Payment fields
  isPaid?: boolean;
  paymentOrderId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentStatus?: string;
  paidAt?: string;
  // Entitlements (from backend)
  entitlements?: Array<{
    id: string;
    maxEdits: number;
    editsUsed: number;
    maxCategoryChanges: number;
    categoryChangesUsed: number;
    status: string;
    expiresAt: string;
    planKey: string;
  }>;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceLevel?: string;
  companyCountry?: string;
  jobArea?: string;
  companyActivity?: string;
  description?: string;
  peopleInCharge?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  country?: string;
  studyArea?: string;
  studyType?: string;
  status?: string;
  description?: string;
}

export interface PostulanteProfile {
  id: string;
  userId: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  phone?: string;
  alternatePhone?: string;
  avatar?: string;
  profilePicture?: string;
  city?: string;
  province?: string;
  country?: string;
  address?: string;
  resumeTitle?: string;
  professionalDescription?: string;
  employmentStatus?: string;
  minimumSalary?: number;
  cv?: string;
  cvUrl?: string;
  videoUrl?: string;
  experiences?: Experience[];
  education?: Education[];
  skills?: string[];
  languages?: Array<{ language: string; level: string }>;
  linkedInUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  user?: { email: string };
}

export interface Application {
  id: string;
  jobId: string;
  postulanteId: string;
  status: string;
  estado?: string;
  appliedAt?: string;
  fechaAplicacion?: string;
  job?: Job;
  postulante?: PostulanteProfile;
}

export interface Subscription {
  id: string;
  planType: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  status: string;
  startDate: string;
  endDate?: string;
  subscription?: {
    status: string;
    endDate?: string;
  };
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  allowedJobs: number;
  allowedModifications: number;
  hasAIFeature: boolean;
  hasFeaturedOption: boolean;
  canModifyCategory: boolean;
  categoryModifications: number;
  features: string[];
  isActive?: boolean;
  order?: number;
}

export interface ApiUserInfo {
  id: string;
  email: string;
  userType: 'POSTULANTE' | 'EMPRESA';
  postulante?: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  empresa?: {
    id: string;
    companyName: string;
    logo?: string;
  };
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isDelivered: boolean;
  isRead: boolean;
  createdAt: string;
  fromUser?: ApiUserInfo;
  toUser?: ApiUserInfo;
}

export interface Conversation {
  user: ApiUserInfo;
  lastMessage: Message;
  unreadCount: number;
}

// Video Meetings
export type VideoMeetingStatus =
  | 'SCHEDULED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'MISSED';

export interface VideoMeeting {
  id: string;
  createdById: string;
  invitedUserId: string;
  title?: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  status: VideoMeetingStatus;
  meetingUrl?: string;
  callId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  googleCalendarEventCreated?: boolean;
  warning?: string;
}

export interface CreateVideoMeetingRequest {
  invitedUserId: string;
  title?: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
}

export interface UpdateVideoMeetingRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  meetingUrl?: string;
}

// Promociones
export interface PromotionData {
  code: string;
  title: string;
  description: string;
  durationDays: number;
  metadata?: {
    icon?: string;
    buttonText?: string;
    [key: string]: any;
  };
}

export interface LaunchTrialStatus {
  eligible: boolean;
  alreadyUsed: boolean;
  windowOpen: boolean;
  reason?: string;
  promotion: PromotionData | null;
}

export interface LaunchTrialClaimResponse {
  id: string;
  status: string;
  claimedAt: string;
  usedAt?: string;
  jobPostId: string;
  entitlement?: {
    jobPostId: string;
    expiresAt: string;
    status: string;
  };
}
