export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ClinicConfig {
  clinicName: string;
  taxId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  appointmentSlotDuration: number; // 15, 30, 60 minutes
  workingDays: string[]; // ['Monday', 'Tuesday', ...]
  startTime: string; // '09:00'
  endTime: string; // '17:00'
}
