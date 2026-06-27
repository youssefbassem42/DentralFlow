export interface PatientShort {
  id: string;
  fullName: string;
  phone: string;
}

export interface DoctorShort {
  id: string;
  name: string;
  specialization?: string | null;
}

export interface MedicalExamination {
  id: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalNotes?: string | null;
  radiologyNotes?: string | null;
  prescription?: string | null;
  recommendations?: string | null;
  examDate: string;
  createdAt: string;
  updatedAt: string;
  patient?: PatientShort;
  doctor?: DoctorShort;
}

export interface ExaminationsResponse {
  success: boolean;
  data: {
    examinations: MedicalExamination[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleExaminationResponse {
  success: boolean;
  data: MedicalExamination;
}
