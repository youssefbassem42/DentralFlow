import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Save,
  Edit,
  AlertCircle,
  Stethoscope,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Clock,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getTreatmentPlans,
  getTreatmentPlan,
  createTreatmentPlan,
  updateTreatmentPlan,
  getTreatments,
  getPatients,
  getDoctors,
} from './api';
import type { TreatmentPlanStatus } from './types';

// Zod validation schemas
const formSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  doctorId: z.string().uuid('Please select a doctor').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters long'),
  description: z.string().optional().nullable(),
  estimatedCost: z.number().nonnegative('Estimated cost cannot be negative'),
  estimatedSessions: z.number().int().positive('Estimated sessions must be at least 1'),
});

const editFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long'),
  description: z.string().optional().nullable(),
  estimatedCost: z.number().nonnegative('Estimated cost cannot be negative'),
  estimatedSessions: z.number().int().positive('Estimated sessions must be at least 1'),
  status: z.enum(['Pending', 'InProgress', 'Completed', 'Cancelled']),
});

type FormValues = z.infer<typeof formSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

export function TreatmentPlansPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // View States
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  // Search state inside forms
  const [patientSearch, setPatientSearch] = useState('');

  // Role permissions
  const isAdmin = user?.role === 'ADMIN';
  const canModify = isAdmin || user?.role === 'DOCTOR';

  // Fetch doctors & patients
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: view !== 'list',
  });
  const doctors = doctorsData?.data || [];

  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients({ search: patientSearch, limit: 100 }),
    enabled: view !== 'list',
  });
  const patients = patientsData?.data?.patients || [];

  // Fetch treatment plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['treatmentPlans', page, selectedPatientId, selectedDoctorId, selectedStatus],
    queryFn: () =>
      getTreatmentPlans({
        page,
        limit: 10,
        patientId: selectedPatientId || undefined,
        doctorId: selectedDoctorId || undefined,
        status: (selectedStatus as any) || undefined,
      }),
  });
  const plans = plansData?.data?.plans || [];
  const totalPlans = plansData?.data?.total || 0;
  const totalPages = plansData?.data?.pages || 1;

  // Fetch detailed plan
  const { data: detailRes, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['treatmentPlan', selectedPlanId],
    queryFn: () => getTreatmentPlan(selectedPlanId!),
    enabled: !!selectedPlanId && (view === 'detail' || view === 'edit'),
  });
  const detail = detailRes?.data;

  // Fetch treatment sessions related to active plan
  const { data: treatmentsRes, isLoading: isLoadingTreatments } = useQuery({
    queryKey: ['treatments', selectedPlanId],
    queryFn: () => getTreatments({ treatmentPlanId: selectedPlanId!, limit: 100 }),
    enabled: !!selectedPlanId && view === 'detail',
  });
  const treatments = treatmentsRes?.data?.treatments || [];

  // React Hook Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: errorsEdit },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema) as any,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTreatmentPlan,
    onSuccess: (res) => {
      toast.success(res.message || 'Treatment plan proposed successfully.');
      queryClient.invalidateQueries({ queryKey: ['treatmentPlans'] });
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create treatment plan.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTreatmentPlan(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Treatment plan updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['treatmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['treatmentPlan', selectedPlanId] });
      setView('detail');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update treatment plan.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TreatmentPlanStatus }) =>
      updateTreatmentPlan(id, { status }),
    onSuccess: (res) => {
      toast.success(`Plan marked as ${res.data.status}.`);
      queryClient.invalidateQueries({ queryKey: ['treatmentPlans'] });
      queryClient.invalidateQueries({ queryKey: ['treatmentPlan', selectedPlanId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update status.');
    },
  });

  // Action handlers
  const handleNewPlan = () => {
    resetCreate({
      patientId: '',
      doctorId: user ? String(user.id) : '',
      title: '',
      description: '',
      estimatedCost: 0,
      estimatedSessions: 1,
    });
    setView('create');
  };

  const handleEditPlan = () => {
    if (!detail) return;
    resetEdit({
      title: detail.title,
      description: detail.description,
      estimatedCost: Number(detail.estimatedCost),
      estimatedSessions: detail.estimatedSessions,
      status: detail.status,
    });
    setEditValue('status', detail.status);
    setView('edit');
  };

  const handleCreateSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      doctorId: values.doctorId || (user ? String(user.id) : ''),
      status: 'Pending' as const,
      description: values.description || null,
    };
    createMutation.mutate(payload);
  };

  const handleEditSubmit = (values: EditFormValues) => {
    if (!selectedPlanId) return;
    const payload = {
      ...values,
      description: values.description || null,
    };
    updateMutation.mutate({ id: selectedPlanId, data: payload });
  };

  // Local filter
  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patientName = plan.patient?.fullName?.toLowerCase() || '';
    const title = plan.title.toLowerCase();
    const docName = plan.doctor?.name?.toLowerCase() || plan.doctor?.user?.name?.toLowerCase() || '';
    return patientName.includes(query) || title.includes(query) || docName.includes(query);
  });

  // Calculate statistics
  const totalActualCost = treatments.reduce((sum, t) => sum + Number(t.price), 0);
  const recordedSessions = treatments.length;
  const progressPercentage = detail
    ? Math.min(Math.round((recordedSessions / detail.estimatedSessions) * 100), 100)
    : 0;

  // Status badges classes
  const getStatusBadge = (status: TreatmentPlanStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'InProgress':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'Completed':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'Cancelled':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ------------------ VIEW: LIST DIRECTORY ------------------ */}
      {view === 'list' && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Header toolbar */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Treatment Plans</h2>
              <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
              <div className="flex gap-1.5 flex-wrap">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Patients --</option>
                  {plans.map((p) => p.patient).filter((v, i, a) => a.findIndex(t => t?.id === v?.id) === i).map((pat) => pat && (
                    <option key={pat.id} value={pat.id}>
                      {pat.fullName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Doctors --</option>
                  {plans.map((p) => p.doctor).filter((v, i, a) => a.findIndex(t => t?.id === v?.id) === i).map((doc) => doc && (
                    <option key={doc.id} value={doc.id}>
                      {doc.name || doc.user?.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Statuses --</option>
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full lg:w-48"
                />
              </div>
              {canModify && (
                <button
                  onClick={handleNewPlan}
                  className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} /> New Plan
                </button>
              )}
            </div>
          </div>

          {/* List Table */}
          <div className="flex-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            {isLoadingPlans ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
                <p className="text-sm font-semibold">Loading treatment plans...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-4">Patient</th>
                      <th className="p-3">Plan Title</th>
                      <th className="p-3">Est. Sessions</th>
                      <th className="p-3">Estimated Cost</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created Date</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-3 pl-4 font-semibold">{plan.patient?.fullName}</td>
                        <td className="p-3 font-medium">{plan.title}</td>
                        <td className="p-3">{plan.estimatedSessions} sessions</td>
                        <td className="p-3 font-semibold text-primary">
                          ${Number(plan.estimatedCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(plan.status)}`}>
                            {plan.status === 'InProgress' ? 'In Progress' : plan.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setView('detail');
                            }}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded text-[11px] transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPlans.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                          No treatment plans recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="text-xs text-muted-foreground">
                Showing {filteredPlans.length} of {totalPlans} records
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
        </div>
      )}

      {/* ------------------ VIEW: PLAN DETAILS ------------------ */}
      {view === 'detail' && (
        <div className="space-y-6">
          {isLoadingDetail || !detail ? (
            <div className="h-[200px] flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-4">
                <div>
                  <button
                    onClick={() => {
                      setView('list');
                      setSelectedPlanId(null);
                    }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
                  >
                    <ChevronLeft size={12} /> Back to Directory
                  </button>
                  <h2 className="text-xl font-bold text-foreground">Treatment Plan Details</h2>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    {detail.status === 'Pending' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'InProgress' })}
                        className="px-4 py-2 border border-blue-500/20 text-blue-600 bg-blue-500/5 rounded-lg text-xs font-bold hover:bg-blue-500/10 flex items-center gap-2 shadow-sm"
                      >
                        <Clock size={14} /> Start Plan
                      </button>
                    )}
                    {(detail.status === 'Pending' || detail.status === 'InProgress') && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'Completed' })}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Complete Plan
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: detail.id, status: 'Cancelled' })}
                          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                        >
                          <XCircle size={14} /> Cancel Plan
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleEditPlan}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                    >
                      <Edit size={14} /> Edit Plan Details
                    </button>
                  </div>
                )}
              </div>

              {/* Status & Patient context card */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 flex flex-wrap gap-x-8 gap-y-4 shadow-sm items-center">
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {detail.patient?.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{detail.patient?.fullName}</h3>
                    <p className="text-xs text-muted-foreground">Phone: {detail.patient?.phone}</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plan Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase mt-1 w-max ${getStatusBadge(detail.status)}`}>
                    {detail.status === 'InProgress' ? 'In Progress' : detail.status}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Sessions</span>
                  <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                    <Calendar size={13} className="text-muted-foreground" />
                    {detail.estimatedSessions} sessions
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Responsible Doctor</span>
                  <span className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                    <Stethoscope size={13} className="text-muted-foreground" />
                    {detail.doctor?.name || detail.doctor?.user?.name}
                  </span>
                </div>
              </div>

              {/* Main Content Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Columns - Details, Progress & Cost Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Plan title & description */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                      <ClipboardList className="text-primary w-4 h-4" /> Proposed Treatment
                    </h4>
                    <h3 className="text-base font-bold text-foreground">{detail.title}</h3>
                    <p className="text-xs text-muted-foreground bg-surface p-3 rounded-lg border border-outline-variant leading-relaxed">
                      {detail.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Visual Progress bar */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="text-primary w-4 h-4" /> Progress Tracking
                      </h4>
                      <span className="text-xs font-bold text-primary">{progressPercentage}% Completed</span>
                    </div>

                    <div className="w-full bg-outline-variant/30 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center bg-surface p-2 border border-outline-variant rounded-lg">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Sessions</span>
                        <p className="text-sm font-bold text-foreground mt-0.5">{detail.estimatedSessions}</p>
                      </div>
                      <div className="text-center bg-surface p-2 border border-outline-variant rounded-lg">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Recorded Sessions</span>
                        <p className="text-sm font-bold text-foreground mt-0.5">{recordedSessions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Cost cards */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                      <DollarSign className="text-primary w-4 h-4" /> Cost & Financial Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Cost</span>
                          <p className="text-lg font-bold text-foreground mt-0.5">
                            ${Number(detail.estimatedCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actual Invoiced</span>
                          <p className="text-lg font-bold text-foreground mt-0.5">
                            ${totalActualCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Columns - Chronological Treatment Session Timeline */}
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                    <Clock className="text-primary w-4 h-4" /> Treatment Sessions Timeline
                  </h4>

                  {isLoadingTreatments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="animate-spin text-primary w-6 h-6" />
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {treatments.map((session, idx) => (
                        <div key={session.id} className="relative pl-5 border-l border-outline-variant pb-2 last:pb-0">
                          {/* Circle marker */}
                          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface-container-lowest"></div>
                          
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-muted-foreground">Session {idx + 1}</span>
                              <span className="text-muted-foreground">{new Date(session.sessionDate).toLocaleDateString()}</span>
                            </div>
                            <h5 className="font-bold text-foreground">{session.treatmentName}</h5>
                            {session.toothNumber && (
                              <p className="text-[10px] font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5 w-max">
                                Tooth {session.toothNumber}
                              </p>
                            )}
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              {session.procedure || 'No procedure notes recorded.'}
                            </p>
                            <p className="font-bold text-foreground mt-0.5">
                              Price: ${Number(session.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {treatments.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-6">
                          No treatment sessions have been completed or recorded yet under this plan.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: CREATE FORM ------------------ */}
      {view === 'create' && (
        <div className="space-y-6">
          <div className="border-b border-outline-variant pb-4">
            <button
              onClick={() => setView('list')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
            >
              <ChevronLeft size={12} /> Cancel & Return
            </button>
            <h2 className="text-xl font-bold text-foreground">Propose New Treatment Plan</h2>
          </div>

          <form onSubmit={handleSubmitCreate(handleCreateSubmit as any)} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Patient <span className="text-error">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                  />
                  <select
                    {...registerCreate('patientId')}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.phone})
                      </option>
                    ))}
                  </select>
                  {errorsCreate.patientId && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errorsCreate.patientId.message}
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Attending Doctor <span className="text-error">*</span>
                  </label>
                  <select
                    {...registerCreate('doctorId')}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs h-[72px]"
                  >
                    <option value="">-- Assign Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                  {errorsCreate.doctorId && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errorsCreate.doctorId.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Plan Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tooth Extraction & Crown Placement, Root Canal Therapy..."
                {...registerCreate('title')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              {errorsCreate.title && (
                <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errorsCreate.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Plan Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Outline clinical details of the proposed plan steps..."
                {...registerCreate('description')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Estimated Total Cost ($) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...registerCreate('estimatedCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errorsCreate.estimatedCost && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errorsCreate.estimatedCost.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Estimated Sessions <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  placeholder="1"
                  {...registerCreate('estimatedSessions', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errorsCreate.estimatedSessions && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errorsCreate.estimatedSessions.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                {createMutation.isPending ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save size={14} />}
                Save Proposed Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------ VIEW: EDIT FORM ------------------ */}
      {view === 'edit' && (
        <div className="space-y-6">
          <div className="border-b border-outline-variant pb-4">
            <button
              onClick={() => setView('detail')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
            >
              <ChevronLeft size={12} /> Return to Details
            </button>
            <h2 className="text-xl font-bold text-foreground">Edit Treatment Plan Details</h2>
          </div>

          <form onSubmit={handleSubmitEdit(handleEditSubmit as any)} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Plan Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                {...registerEdit('title')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
              />
              {errorsEdit.title && (
                <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errorsEdit.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Plan Description (Optional)
              </label>
              <textarea
                rows={3}
                {...registerEdit('description')}
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Estimated Cost ($) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...registerEdit('estimatedCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errorsEdit.estimatedCost && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errorsEdit.estimatedCost.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Estimated Sessions <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  {...registerEdit('estimatedSessions', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                />
                {errorsEdit.estimatedSessions && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errorsEdit.estimatedSessions.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Plan Status <span className="text-error">*</span>
                </label>
                <select
                  {...registerEdit('status')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {errorsEdit.status && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errorsEdit.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={() => setView('detail')}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                {updateMutation.isPending ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
