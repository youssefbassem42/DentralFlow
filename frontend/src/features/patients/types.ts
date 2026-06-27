export interface Patient {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    role: string;
  } | null;
  balance?: number;
  lastVisit?: string | null;
  nextAppointment?: {
    date: string;
    reason: string;
  } | null;
  status?: 'Active' | 'Inactive';
}

export interface PatientFilters {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  bloodGroup?: string;
  doctorId?: string;
  status?: 'Active' | 'Inactive';
  lastVisit?: 'last30Days' | 'last6Months' | 'anyTime';
}

export interface PatientResponse {
  success: boolean;
  message: string;
  data: {
    patients: Patient[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// ========== Patient Profile (Aggregated) ==========

export interface ProfileAppointment {
  id: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Missed';
  reason: string | null;
  notes: string | null;
}

export interface ProfileExamination {
  id: string;
  doctorName: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalNotes: string | null;
  prescription: string | null;
  recommendations: string | null;
  examDate: string;
}

export interface ProfileTreatmentPlan {
  id: string;
  doctorName: string;
  title: string;
  description: string | null;
  estimatedCost: number;
  estimatedSessions: number;
  completedSessions: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface ProfileTreatment {
  id: string;
  doctorName: string;
  treatmentPlan: { id: string; title: string } | null;
  treatmentName: string;
  toothNumber: number | null;
  procedure: string | null;
  price: number;
  sessionDate: string;
  notes: string | null;
}

export interface ProfilePayment {
  id: string;
  doctorName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Visa' | 'Insurance' | 'Wallet';
  invoiceNumber: string;
  notes: string | null;
  paymentDate: string;
}

export interface ProfileAttachment {
  id: string;
  doctorName: string;
  fileName: string;
  filePath: string;
  fileType: 'X_Ray' | 'Prescription' | 'Images';
  notes: string | null;
  createdAt: string;
}

export interface PatientProfile extends Patient {
  appointments: ProfileAppointment[];
  examinations: ProfileExamination[];
  treatmentPlans: ProfileTreatmentPlan[];
  treatments: ProfileTreatment[];
  payments: ProfilePayment[];
  attachments: ProfileAttachment[];
}

export interface PatientProfileResponse {
  success: boolean;
  message: string;
  data: PatientProfile;
}
