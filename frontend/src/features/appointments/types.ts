export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Missed';

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor;
  creator?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  appointmentDate?: string;
  today?: boolean;
}
