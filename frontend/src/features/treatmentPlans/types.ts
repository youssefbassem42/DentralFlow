export type TreatmentPlanStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Treatment {
  id: string;
  patientId: string;
  doctorId: string;
  treatmentPlanId: string;
  treatmentName: string;
  toothNumber: number | null;
  procedure: string | null;
  price: number | string;
  sessionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string | null;
  estimatedCost: number | string;
  estimatedSessions: number;
  status: TreatmentPlanStatus;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor & { user?: { name: string } };
  treatments?: Treatment[];
}

export interface TreatmentPlansFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  status?: TreatmentPlanStatus;
}

export interface TreatmentPlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: TreatmentPlan[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SingleTreatmentPlanResponse {
  success: boolean;
  message: string;
  data: TreatmentPlan;
}

export interface TreatmentsResponse {
  success: boolean;
  message: string;
  data: {
    treatments: Treatment[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
