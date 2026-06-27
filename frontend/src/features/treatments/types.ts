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
  title: string;
  status: string;
  estimatedCost: number | string;
  estimatedSessions: number;
}

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
  patient?: Patient;
  doctor?: Doctor & { user?: { name: string } };
  treatmentPlan?: TreatmentPlan;
}

export interface TreatmentFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  treatmentPlanId?: string;
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

export interface SingleTreatmentResponse {
  success: boolean;
  message: string;
  data: Treatment;
}

export interface TreatmentPlanShort {
  id: string;
  title: string;
  status: string;
}

export interface TreatmentPlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: TreatmentPlanShort[];
  };
}
