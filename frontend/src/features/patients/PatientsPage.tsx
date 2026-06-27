import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  User,
  Activity,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from './api';
import { getDoctors } from '@/features/doctors/api';
import type { Patient } from './types';

// Client-side validation schema
const patientFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phone: z.string().min(5, 'Phone number must be at least 5 characters long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export function PatientsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLastVisit, setSelectedLastVisit] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Roles permissions
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const canModify = isAdmin || isReceptionist;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema) as any,
  });

  // Query Doctors for dentist dropdown filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: getDoctors,
  });
  const doctors = doctorsData?.data || [];

  // Query paginated and filtered patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: [
      'patients',
      page,
      searchQuery,
      selectedGender,
      selectedBloodGroup,
      selectedDoctorId,
      selectedStatus,
      selectedLastVisit,
    ],
    queryFn: () =>
      getPatients({
        page,
        limit: 10,
        search: searchQuery || undefined,
        gender: selectedGender || undefined,
        bloodGroup: selectedBloodGroup || undefined,
        doctorId: selectedDoctorId || undefined,
        status: (selectedStatus as any) || undefined,
        lastVisit: (selectedLastVisit as any) || undefined,
      }),
  });
  const patients = patientsData?.data?.patients || [];
  const totalPatients = patientsData?.data?.pagination?.total || 0;
  const totalPages = patientsData?.data?.pagination?.totalPages || 1;

  // Query all patients to compute summary statistics cards (limit 500)
  const { data: allPatientsData } = useQuery({
    queryKey: ['patients-all-summary'],
    queryFn: () => getPatients({ limit: 500 }),
  });
  const allPatients = allPatientsData?.data?.patients || [];

  // Statistics calculation
  const totalPatientsCount = allPatients.length;
  const activePatientsCount = allPatients.filter((p) => p.status === 'Active').length;
  const totalOutstandingBalance = allPatients.reduce((sum, p) => sum + (p.balance || 0), 0);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (res) => {
      toast.success(res.message || 'Patient registered successfully.');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-all-summary'] });
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      const errorMsg = err.message || 'Failed to register patient.';
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePatient>[1] }) =>
      updatePatient(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Patient profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-all-summary'] });
      setIsFormOpen(false);
      setEditingPatient(null);
      reset();
    },
    onError: (err: any) => {
      const errorMsg = err.message || 'Failed to update patient profile.';
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: (res) => {
      toast.success(res.message || 'Patient deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-all-summary'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete patient.');
    },
  });

  // Action handlers
  const handleFormSubmit = (values: PatientFormValues) => {
    const payload = {
      fullName: values.fullName,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      phone: values.phone,
      email: values.email || null,
      address: values.address || null,
      bloodGroup: values.bloodGroup || null,
      allergies: values.allergies || null,
      medicalHistory: values.medicalHistory || null,
      notes: values.notes || null,
    };

    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEditOpen = (patient: Patient) => {
    setEditingPatient(patient);
    // Format DOB to YYYY-MM-DD for the HTML date input
    const dobFormatted = patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
      : '';

    reset({
      fullName: patient.fullName,
      gender: patient.gender,
      dateOfBirth: dobFormatted,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      bloodGroup: patient.bloodGroup || '',
      allergies: patient.allergies || '',
      medicalHistory: patient.medicalHistory || '',
      notes: patient.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleCreateOpen = () => {
    setEditingPatient(null);
    reset({
      fullName: '',
      gender: 'Male',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      bloodGroup: '',
      allergies: '',
      medicalHistory: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      deleteMutation.mutate(id);
    }
  };

  // Helper calculations
  const formatPatientId = (id: string) => {
    return `#PT-${id.slice(-4).toUpperCase()}`;
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ------------------ STATISTICS CARDS ------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Patients */}
        <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Patients</span>
            <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalPatientsCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Patients registered in the system</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <User size={24} />
          </div>
        </div>

        {/* Active Patients */}
        <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Patients</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activePatientsCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Visited or scheduled in the last 6 months</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Activity size={24} />
          </div>
        </div>

        {/* Clinic Financial Balances */}
        <div className={`bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between ${
          totalOutstandingBalance > 0 ? 'border-rose-200 dark:border-rose-950' : 'border-outline-variant'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clinic Debt Balance</span>
            <h3 className={`text-2xl font-extrabold mt-1 ${totalOutstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
              EGP {totalOutstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">Total outstanding patient invoices</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* ------------------ FILTERS & SEARCH TOOLBAR ------------------ */}
      <div className="bg-card border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <User size={16} className="text-primary" /> Patients Directory
          </h3>
          {canModify && (
            <button
              onClick={handleCreateOpen}
              className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2 w-full lg:w-auto justify-center"
            >
              <Plus size={14} /> Register Patient
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full"
            />
          </div>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => {
              setSelectedGender(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          {/* Blood Group Filter */}
          <select
            value={selectedBloodGroup}
            onChange={(e) => {
              setSelectedBloodGroup(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full"
          >
            <option value="">Blood Group (All)</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>

          {/* Dentist Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full"
          >
            <option value="">All Dentists</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Last Visit Filter */}
          <select
            value={selectedLastVisit}
            onChange={(e) => {
              setSelectedLastVisit(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1"
          >
            <option value="">Last Visit (Any)</option>
            <option value="last30Days">Last 30 Days</option>
            <option value="last6Months">Last 6 Months</option>
          </select>
        </div>
      </div>

      {/* ------------------ PATIENTS TABLE ------------------ */}
      <div className="bg-card border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoadingPatients ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
            <p className="text-sm font-semibold">Loading patients directory...</p>
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4 pl-6">Patient</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Visit</th>
                  <th className="p-4">Next Appt</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                {patients.map((p) => {
                  const avatarColor =
                    p.gender === 'Male'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300';
                  const initials = p.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}>
                            {initials}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/patients/${p.id}`)}
                              className="font-semibold text-primary hover:underline block text-left"
                            >
                              {p.fullName}
                            </button>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {p.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-muted-foreground">
                        {formatPatientId(p.id)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          p.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-905'
                            : 'bg-muted/60 dark:bg-muted-950 text-muted-foreground border-outline-variant'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {p.lastVisit
                          ? new Date(p.lastVisit).toLocaleDateString([], {
                              dateStyle: 'medium',
                            })
                          : 'No visits recorded'}
                      </td>
                      <td className="p-4">
                        {p.nextAppointment ? (
                          <div>
                            <span className="font-semibold text-foreground block">
                              {new Date(p.nextAppointment.date).toLocaleDateString([], {
                                dateStyle: 'short',
                              })}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[150px]">
                              {p.nextAppointment.reason}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Unscheduled</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${
                          p.balance && p.balance > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          EGP {Number(p.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => navigate(`/patients/${p.id}`)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-container rounded transition-all"
                          title="View Profile Details"
                        >
                          <FileText size={14} />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleEditOpen(p)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all"
                            title="Edit Patient"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canModify && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded transition-all"
                            title="Delete Patient"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground font-semibold">
                      No patients found matching the selected query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
          <span className="text-xs text-muted-foreground">
            Showing {patients.length} of {totalPatients} patients
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 border border-outline-variant rounded bg-surface hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------ REGISTER / EDIT PATIENT MODAL ------------------ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-outline-variant rounded-xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 border-b border-outline-variant pb-2">
              <User size={18} className="text-primary" />
              {editingPatient ? 'Update Patient Profile' : 'Register New Patient'}
            </h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Row 1: Name & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    {...register('fullName')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-error mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Gender <span className="text-error">*</span>
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-[10px] text-error mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2: DOB & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Date of Birth <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-[10px] text-error mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +123456789"
                    {...register('phone')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-error mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Email & Blood Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. email@example.com"
                    {...register('email')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.email && (
                    <p className="text-[10px] text-error mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    {...register('bloodGroup')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Address */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Home Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Cairo, Egypt"
                  {...register('address')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Row 5: Allergies & Medical History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Known Allergies
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Penicillin, Pollen, Latex (or none)"
                    {...register('allergies')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Medical History
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Diabetes, Hypertension, Heart Conditions"
                    {...register('medicalHistory')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  General Patient Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional patient notes, preferences, or observations..."
                  {...register('notes')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1 shadow-sm"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="animate-spin w-3 h-3" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
