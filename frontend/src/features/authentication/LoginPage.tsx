import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from './types';
import type { LoginCredentials } from './types';
import { useLogin } from './hooks';
import { Mail, Lock, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/Logo';

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-sans text-foreground p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Logo Area */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center overflow-hidden border border-outline-variant">
            <Logo className="w-10 h-10" />
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-8">
          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-[28px] leading-[36px] font-semibold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm md:text-base text-muted-foreground">Log in to manage your clinic.</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1 tracking-wide" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                  <Mail size={20} />
                </div>
                <input
                  className={`block w-full pl-9 pr-2 py-2 rounded-md border ${errors.email ? 'border-destructive' : 'border-outline-variant'} focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-foreground text-sm placeholder:text-muted-foreground transition-all duration-200`}
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-muted-foreground tracking-wide" htmlFor="password">
                  Password
                </label>
                <a className="text-[11px] font-semibold text-primary hover:text-primary-container transition-colors duration-200" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground">
                  <Lock size={20} />
                </div>
                <input
                  className={`block w-full pl-9 pr-9 py-2 rounded-md border ${errors.password ? 'border-destructive' : 'border-outline-variant'} focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-foreground text-sm placeholder:text-muted-foreground transition-all duration-200`}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-muted-foreground hover:text-foreground focus:outline-none focus:text-primary transition-colors duration-200"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <EyeOff size={20} />
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer transition-colors duration-200"
                id="remember-me"
                type="checkbox"
              />
              <label className="ml-2 block text-sm text-muted-foreground cursor-pointer" htmlFor="remember-me">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-semibold text-primary-foreground bg-primary hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center justify-center">
            <div className="border-t border-outline-variant flex-grow"></div>
            <span className="px-2 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider bg-surface-container-lowest">
              Or continue with
            </span>
            <div className="border-t border-outline-variant flex-grow"></div>
          </div>

          {/* SSO Option */}
          <div className="mt-6">
            <button
              className="w-full flex items-center justify-center px-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest text-foreground text-base font-semibold hover:bg-muted transition-colors duration-200"
              type="button"
            >
              <Shield className="mr-2" size={20} />
              Single Sign-On (SSO)
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <a className="text-base font-semibold text-primary hover:text-primary/80 transition-colors duration-200" href="#">Contact Sales</a>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex items-center justify-center space-x-4 text-muted-foreground/70">
          <div className="flex items-center space-x-1 text-[11px] font-semibold">
            <Shield size={16} />
            <span>HIPAA Compliant</span>
          </div>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center space-x-1 text-[11px] font-semibold">
            <Lock size={16} />
            <span>End-to-End Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
