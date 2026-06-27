export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
  users: {
    base: '/users',
    doctors: '/users?role=DOCTOR',
  },
  patients: {
    base: '/patients',
    byId: (id: string) => `/patients/${id}`,
  },
  appointments: {
    base: '/appointments',
    byId: (id: string) => `/appointments/${id}`,
  },
  examinations: {
    base: '/examinations',
    byPatientId: (patientId: string) => `/examinations?patientId=${patientId}`,
  },
  treatmentPlans: {
    base: '/treatment-plans',
  },
  treatments: {
    base: '/treatments',
  },
  payments: {
    base: '/payments',
  },
  attachments: {
    base: '/attachments',
  },
  inventory: {
    base: '/inventory',
  },
  reports: {
    base: '/reports',
    dashboard: '/reports/dashboard',
  },
};
