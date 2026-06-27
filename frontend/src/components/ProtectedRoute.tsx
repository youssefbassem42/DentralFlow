import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/authentication/context';
import { AppLayout } from './layout/AppLayout';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}
