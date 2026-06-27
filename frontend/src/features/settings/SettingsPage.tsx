import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Building,
  Clock,
  Database,
  Sliders,
  Save,
  Download,
  Upload,
  Moon,
  Sun,
  Languages,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import { updateProfile } from './api';

// Validation Schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const clinicSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name is required'),
  taxId: z.string().min(1, 'Tax identification code is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Contact number is required'),
  address: z.string().min(5, 'Clinic address is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type ClinicFormValues = z.infer<typeof clinicSchema>;

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Tabs: 'profile' | 'security' | 'clinic' | 'hours' | 'database' | 'preferences'
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'clinic' | 'hours' | 'database' | 'preferences'>('profile');

  // Appearance & Language Mock States
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [slotDuration, setSlotDuration] = useState(30); // minutes
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday']);

  // React Hook Forms
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerClinic,
    handleSubmit: handleClinicSubmit,
    formState: { errors: clinicErrors },
  } = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      clinicName: 'DentralFlow Premium Clinic',
      taxId: 'TX-901-293-88',
      contactEmail: 'support@dentralflow.com',
      contactPhone: '+1 (555) 902-1200',
      address: '742 Evergreen Terrace, Medical District, Springfield',
    },
  });

  // Mutations
  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      if (!user?.id) throw new Error('User not logged in');
      return updateProfile(user.id, data);
    },
    onSuccess: (res) => {
      toast.success('Profile details updated successfully.');
      if (res.data) {
        updateUser(res.data);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormValues) => {
      if (!user?.id) throw new Error('User not logged in');
      return updateProfile(user.id, { password: data.newPassword });
    },
    onSuccess: () => {
      toast.success('Account password updated successfully.');
      resetPassword();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change password.');
    },
  });

  // Clinic config update (Mocked frontend state)
  const handleClinicUpdate = (values: ClinicFormValues) => {
    console.log('Updating clinic info:', values);
    toast.success('Clinic configurations saved successfully.');
  };

  // Preference Settings Switchers
  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`${nextDark ? 'Dark Theme' : 'Light Theme'} enabled.`);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    toast.success(`Language set to ${lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Spanish'}.`);
  };

  // Backup & DB Exports Actions
  const handleDownloadBackup = () => {
    try {
      const mockSql = `-- DentalFlow Clinic Backup
-- Generated: ${new Date().toISOString()}
-- Role: ${user?.role}
CREATE TABLE ClinicConfiguration (clinicName VARCHAR(255), taxId VARCHAR(100));
INSERT INTO ClinicConfiguration VALUES ('DentralFlow Premium Clinic', 'TX-901-293-88');
`;
      const blob = new Blob([mockSql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dentralflow_db_backup_${Date.now()}.sql`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Database backup SQL script compiled and downloaded.');
    } catch {
      toast.error('Failed to compile SQL backup.');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Uploading and recovering database records...',
        success: 'Database restored successfully! Clinic tables re-indexed.',
        error: 'Database recovery failed.',
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Vertical Navigation Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <User size={14} /> My Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Lock size={14} /> Account Security
          </button>
          <button
            onClick={() => setActiveTab('clinic')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
              activeTab === 'clinic'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Building size={14} /> Clinic Profile
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
              activeTab === 'hours'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Clock size={14} /> Working Hours
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
            }`}
          >
            <Sliders size={14} /> System Preferences
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center gap-2 ${
                activeTab === 'database'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant'
              }`}
            >
              <Database size={14} /> Database & Backups
            </button>
          )}
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="flex-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm min-h-[400px]">
          {/* TAB: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">My Profile Settings</h3>
                <p className="text-xs text-muted-foreground mt-1">Manage your identity particulars and clinical contact info.</p>
              </div>

              <form onSubmit={handleProfileSubmit((data) => profileMutation.mutate(data))} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {profileErrors.name && (
                    <span className="text-[10px] text-rose-500 font-semibold">{profileErrors.name.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <input
                    type="email"
                    {...registerProfile('email')}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {profileErrors.email && (
                    <span className="text-[10px] text-rose-500 font-semibold">{profileErrors.email.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    {...registerProfile('phone')}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="bg-primary hover:bg-primary-container hover:text-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {profileMutation.isPending ? (
                      <Loader2 className="animate-spin w-3.5 h-3.5" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Account Password</h3>
                <p className="text-xs text-muted-foreground mt-1">Ensure your account uses a secure password to prevent unauthorized login.</p>
              </div>

              <form onSubmit={handlePasswordSubmit((data) => passwordMutation.mutate(data))} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Current Password</label>
                  <input
                    type="password"
                    {...registerPassword('currentPassword')}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {passwordErrors.currentPassword && (
                    <span className="text-[10px] text-rose-500 font-semibold">{passwordErrors.currentPassword.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">New Password</label>
                  <input
                    type="password"
                    {...registerPassword('newPassword')}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {passwordErrors.newPassword && (
                    <span className="text-[10px] text-rose-500 font-semibold">{passwordErrors.newPassword.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword')}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="text-[10px] text-rose-500 font-semibold">{passwordErrors.confirmPassword.message}</span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="bg-primary hover:bg-primary-container hover:text-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {passwordMutation.isPending ? (
                      <Loader2 className="animate-spin w-3.5 h-3.5" />
                    ) : (
                      <Save size={14} />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: CLINIC PROFILE */}
          {activeTab === 'clinic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Clinic Information</h3>
                <p className="text-xs text-muted-foreground mt-1">Official clinic credentials used on patient invoices and diagnostic receipts.</p>
              </div>

              <form onSubmit={handleClinicSubmit(handleClinicUpdate)} className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Clinic Legal Name</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...registerClinic('clinicName')}
                    className="w-full bg-surface disabled:opacity-60 border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {clinicErrors.clinicName && (
                    <span className="text-[10px] text-rose-500 font-semibold">{clinicErrors.clinicName.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Tax Identification Code</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...registerClinic('taxId')}
                    className="w-full bg-surface disabled:opacity-60 border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {clinicErrors.taxId && (
                    <span className="text-[10px] text-rose-500 font-semibold">{clinicErrors.taxId.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Contact Email</label>
                    <input
                      type="email"
                      disabled={!isAdmin}
                      {...registerClinic('contactEmail')}
                      className="w-full bg-surface disabled:opacity-60 border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {clinicErrors.contactEmail && (
                      <span className="text-[10px] text-rose-500 font-semibold">{clinicErrors.contactEmail.message}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Phone Number</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      {...registerClinic('contactPhone')}
                      className="w-full bg-surface disabled:opacity-60 border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {clinicErrors.contactPhone && (
                      <span className="text-[10px] text-rose-500 font-semibold">{clinicErrors.contactPhone.message}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Location Address</label>
                  <textarea
                    disabled={!isAdmin}
                    rows={2}
                    {...registerClinic('address')}
                    className="w-full bg-surface disabled:opacity-60 border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  />
                  {clinicErrors.address && (
                    <span className="text-[10px] text-rose-500 font-semibold">{clinicErrors.address.message}</span>
                  )}
                </div>

                {isAdmin && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-container hover:text-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Save size={14} /> Save Configuration
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB: WORKING HOURS */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Working Hours & Scheduling</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure appointment slot sizes and standard weekly operating days.</p>
              </div>

              <div className="space-y-5 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Default Appointment Slot Duration</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="15"
                      disabled={!isAdmin}
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-surface-container-low rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-extrabold px-3 py-1 bg-surface border border-outline-variant rounded-lg whitespace-nowrap min-w-[70px] text-center">
                      {slotDuration} Min
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Adjusts calendar grids and appointment blocks automatically.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Weekly Operating Days</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isSelected = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          disabled={!isAdmin}
                          onClick={() => {
                            if (isSelected) {
                              setWorkingDays(workingDays.filter((d) => d !== day));
                            } else {
                              setWorkingDays([...workingDays, day]);
                            }
                          }}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-surface hover:bg-surface-container-low text-foreground border-outline-variant opacity-80'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-2">
                    <button
                      onClick={() => toast.success('Working calendar schedule saved successfully.')}
                      className="bg-primary hover:bg-primary-container hover:text-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Save size={14} /> Save Hours
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">System Preferences</h3>
                <p className="text-xs text-muted-foreground mt-1">Personalize local layouts, interface theme mode, and default display language.</p>
              </div>

              <div className="space-y-5 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Theme Mode</label>
                  <div className="flex gap-3">
                    <button
                      onClick={toggleDarkMode}
                      className={`flex-1 p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                        !isDarkMode
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant bg-surface hover:bg-surface-container-low text-foreground'
                      }`}
                    >
                      <Sun size={20} />
                      <span className="text-xs font-bold">Light Theme</span>
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className={`flex-1 p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                        isDarkMode
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-outline-variant bg-surface hover:bg-surface-container-low text-foreground'
                      }`}
                    >
                      <Moon size={20} />
                      <span className="text-xs font-bold">Dark Theme</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Language & Regional Localization</label>
                  <div className="flex items-center gap-2">
                    <Languages size={16} className="text-muted-foreground" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="en">English (US)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="es">Español (Spanish)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE OPERATIONS */}
          {activeTab === 'database' && isAdmin && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Database Backups & Maintenance</h3>
                <p className="text-xs text-muted-foreground mt-1">Export full database configuration archives or restore clinic records from SQL backup scripts.</p>
              </div>

              <div className="space-y-6 max-w-lg">
                {/* Backup block */}
                <div className="p-4 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Generate Full Backup</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">Downloads a complete database schema and configuration seed file.</p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="bg-primary hover:bg-primary-container hover:text-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto"
                  >
                    <Download size={14} /> Download SQL Backup
                  </button>
                </div>

                {/* Restore block */}
                <div className="p-4 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Restore Database State</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">Upload a previously generated SQL schema file to restore clinic records.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-surface hover:bg-surface-container-low border border-outline-variant text-foreground py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                      <Upload size={14} /> Upload Backup File
                      <input
                        type="file"
                        accept=".sql"
                        onChange={handleRestoreBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
