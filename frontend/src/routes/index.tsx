import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/authentication/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PatientsPage } from '@/features/patients/PatientsPage';
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage';
import { DoctorsPage } from '@/features/doctors/DoctorsPage';
import { WarehousePage } from '@/features/warehouse/WarehousePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ExaminationsPage } from '@/features/medicalExaminations/ExaminationsPage';
import { TreatmentPlansPage } from '@/features/treatmentPlans/TreatmentPlansPage';
import { TreatmentsPage } from '@/features/treatments/TreatmentsPage';
import { PaymentsPage } from '@/features/payments/PaymentsPage';
import { AttachmentsPage } from '@/features/attachments/AttachmentsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/patients',
        element: <PatientsPage />,
      },
      {
        path: '/appointments',
        element: <AppointmentsPage />,
      },
      {
        path: '/examinations',
        element: <ExaminationsPage />,
      },
      {
        path: '/treatment-plans',
        element: <TreatmentPlansPage />,
      },
      {
        path: '/treatments',
        element: <TreatmentsPage />,
      },
      {
        path: '/payments',
        element: <PaymentsPage />,
      },
      {
        path: '/attachments',
        element: <AttachmentsPage />,
      },
      {
        path: '/reports',
        element: <ReportsPage />,
      },
      {
        path: '/doctors',
        element: <DoctorsPage />,
      },
      {
        path: '/warehouse',
        element: <WarehousePage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
