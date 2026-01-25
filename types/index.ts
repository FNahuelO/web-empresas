export interface User {
  id: string;
  email: string;
  role: 'EMPRESA' | 'POSTULANTE';
  nombreEmpresa?: string;
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
  status: string;
  moderationStatus?: string;
  moderationReason?: string;
  autoRejectionReason?: string;
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
  postulante?: {
    id: string;
    userId: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    profilePicture?: string;
    city?: string;
    resumeTitle?: string;
    professionalDescription?: string;
    cv?: string;
    cvUrl?: string;
    videoUrl?: string;
  };
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
  allowedJobs: number;
  allowedModifications: number;
  hasAIFeature: boolean;
  features: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    nombreEmpresa?: string;
  };
  receiver?: {
    id: string;
    email: string;
  };
}

export interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
}

