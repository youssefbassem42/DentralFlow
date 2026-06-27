import { useMutation } from '@tanstack/react-query';
import { login } from './api';
import type { LoginCredentials } from './types';
import { useAuth } from './context';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data);
        toast.success(response.message || 'Successfully logged in!');
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Login failed');
      }
    },
    onError: (error: any) => {
      const message = error?.message || 'Invalid credentials or server error.';
      toast.error(message);
    },
  });
};
