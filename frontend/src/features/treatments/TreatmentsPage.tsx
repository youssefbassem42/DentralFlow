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
  Printer,
  FileText,
  DollarSign,
  Info,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import { useNavigate } from 'react-router-dom';
import {
  getTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  getPatients,
  getDoctors,
  getTreatmentPlans,
} from './api';

// FDI Tooth Chart Definitions
const upperQuadrants = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
];
const lowerQuadrants = [
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
];

// Zod validation schemas
const formSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  treatmentPlanId: z.string().uuid('Please select a treatment plan'),
  doctorId: z.string().uuid('Please select a doctor').optional(),
  treatmentName: z.string().min(1, 'Treatment name is required'),
  toothNumber: z.number().int().positive().nullable().optional(),
  procedure: z.string().optional().nullable(),
  price: z.number().nonnegative('Price cannot be negative'),
  sessionDate: z.string().min(1, 'Session date is required'),
  notes: z.string().optional().nullable(),
});

const editFormSchema = z.object({
  treatmentName: z.string().min(1, 'Treatment name is required'),
  toothNumber: z.number().int().positive().nullable().optional(),
  procedure: z.string().optional().nullable(),
  price: z.number().nonnegative('Price cannot be negative'),
  sessionDate: z.string().min(1, 'Session date is required'),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

export function TreatmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // View States
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [page, setPage] = useState(1);

  // Search state inside forms
  const [patientSearch, setPatientSearch] = useState('');
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

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

  // Fetch patient's active/pending treatment plans
  const { data: plansData } = useQuery({
    queryKey: ['treatmentPlans', activePatientId],
    queryFn: () => getTreatmentPlans({ patientId: activePatientId! }),
    enabled: !!activePatientId && view === 'create',
  });
  const treatmentPlans = plansData?.data?.plans || [];

  // Fetch treatments list
  const { data: treatmentsData, isLoading: isLoadingTreatments } = useQuery({
    queryKey: ['treatments', page, selectedPatientId, selectedDoctorId],
    queryFn: () =>
      getTreatments({
        page,
        limit: 10,
        patientId: selectedPatientId || undefined,
        doctorId: selectedDoctorId || undefined,
      }),
  });
  const treatments = treatmentsData?.data?.treatments || [];
  const totalTreatments = treatmentsData?.data?.total || 0;
  const totalPages = treatmentsData?.data?.pages || 1;

  // Fetch detailed treatment
  const { data: detailRes, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['treatment', selectedTreatmentId],
    queryFn: () => getTreatment(selectedTreatmentId!),
    enabled: !!selectedTreatmentId && (view === 'detail' || view === 'edit'),
  });
  const detail = detailRes?.data;

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
    formState: { errors: errorsEdit },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema) as any,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTreatment,
    onSuccess: (res) => {
      toast.success(res.message || 'Treatment session recorded successfully.');
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record treatment.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTreatment(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Treatment details updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['treatment', selectedTreatmentId] });
      setView('detail');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update treatment.');
    },
  });

  // Action handlers
  const handleNewTreatment = () => {
    setSelectedTooth(null);
    setActivePatientId(null);
    resetCreate({
      patientId: '',
      treatmentPlanId: '',
      doctorId: user ? String(user.id) : '',
      treatmentName: '',
      toothNumber: null,
      procedure: '',
      price: 0,
      sessionDate: new Date().toISOString().substring(0, 16),
      notes: '',
    });
    setView('create');
  };

  const handleEditTreatment = () => {
    if (!detail) return;
    setSelectedTooth(detail.toothNumber);
    resetEdit({
      treatmentName: detail.treatmentName,
      toothNumber: detail.toothNumber,
      procedure: detail.procedure,
      price: Number(detail.price),
      sessionDate: new Date(detail.sessionDate).toISOString().substring(0, 16),
      notes: detail.notes,
    });
    setView('edit');
  };

  const handleCreateSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      doctorId: values.doctorId || (user ? String(user.id) : ''),
      toothNumber: selectedTooth || null,
      procedure: values.procedure || null,
      notes: values.notes || null,
      sessionDate: new Date(values.sessionDate).toISOString(),
    };
    createMutation.mutate(payload);
  };

  const handleEditSubmit = (values: EditFormValues) => {
    if (!selectedTreatmentId) return;
    const payload = {
      ...values,
      toothNumber: selectedTooth || null,
      procedure: values.procedure || null,
      notes: values.notes || null,
      sessionDate: new Date(values.sessionDate).toISOString(),
    };
    updateMutation.mutate({ id: selectedTreatmentId, data: payload });
  };

  // Local filter
  const filteredTreatments = treatments.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patientName = t.patient?.fullName?.toLowerCase() || '';
    const name = t.treatmentName.toLowerCase();
    const docName = t.doctor?.name?.toLowerCase() || t.doctor?.user?.name?.toLowerCase() || '';
    return patientName.includes(query) || name.includes(query) || docName.includes(query);
  });

  const handlePrint = () => {
    window.print();
  };

  // FDI charting grid helper
  const ToothGrid = ({
    selected,
    onSelect,
    readOnly = false,
  }: {
    selected: number | null;
    onSelect?: (num: number) => void;
    readOnly?: boolean;
  }) => {
    const renderRow = (quad: number[]) => (
      <div className="flex gap-1.5 justify-center">
        {quad.map((num) => {
          const isSelected = selected === num;
          return (
            <button
              key={num}
              type="button"
              disabled={readOnly}
              onClick={() => onSelect && onSelect(num)}
              className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                  : 'bg-surface hover:bg-primary/10 border-outline-variant text-foreground'
              }`}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>
    );

    return (
      <div className="p-4 bg-surface-container-low dark:bg-inverse-surface border border-outline-variant rounded-xl space-y-4 max-w-lg mx-auto">
        <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          FDI odontogram (Click to select tooth)
        </div>
        <div className="space-y-3">
          {/* Upper teeth */}
          <div className="flex justify-center gap-6">
            {renderRow(upperQuadrants[0])}
            <div className="w-px bg-outline-variant"></div>
            {renderRow(upperQuadrants[1])}
          </div>
          <div className="h-px bg-outline-variant"></div>
          {/* Lower teeth */}
          <div className="flex justify-center gap-6">
            {renderRow(lowerQuadrants[0])}
            <div className="w-px bg-outline-variant"></div>
            {renderRow(lowerQuadrants[1])}
          </div>
        </div>
        {selected && (
          <div className="flex justify-between items-center text-xs border-t border-outline-variant pt-2">
            <span className="font-semibold text-muted-foreground">Selected Tooth:</span>
            <span className="font-bold text-primary bg-primary/10 rounded px-2 py-0.5">Tooth {selected}</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onSelect && onSelect(0)}
                className="text-[10px] text-error font-bold hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ------------------ VIEW: LIST DIRECTORY ------------------ */}
      {view === 'list' && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Header toolbar */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Treatment Sessions</h2>
              <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
              <div className="flex gap-1.5 flex-wrap">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All Patients --</option>
                  {treatments.map((t) => t.patient).filter((v, i, a) => a.findIndex(x => x?.id === v?.id) === i).map((pat) => pat && (
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
                  {treatments.map((t) => t.doctor).filter((v, i, a) => a.findIndex(x => x?.id === v?.id) === i).map((doc) => doc && (
                    <option key={doc.id} value={doc.id}>
                      {doc.name || doc.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search treatments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full lg:w-48"
                />
              </div>
              {canModify && (
                <button
                  onClick={handleNewTreatment}
                  className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Record Session
                </button>
              )}
            </div>
          </div>

          {/* Table list */}
          <div className="flex-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            {isLoadingTreatments ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
                <p className="text-sm font-semibold">Loading treatment history...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-4">Patient</th>
                      <th className="p-3">Procedure/Name</th>
                      <th className="p-3">Tooth</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Invoiced Price</th>
                      <th className="p-3">Session Date</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                    {filteredTreatments.map((t) => (
                      <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-3 pl-4 font-semibold">{t.patient?.fullName}</td>
                        <td className="p-3 font-medium">{t.treatmentName}</td>
                        <td className="p-3">
                          {t.toothNumber ? (
                            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-bold">
                              Tooth {t.toothNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">General</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {t.doctor?.name || t.doctor?.user?.name}
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ${Number(t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(t.sessionDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedTreatmentId(t.id);
                              setView('detail');
                            }}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded text-[11px] transition-colors"
                          >
                            View Summary
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTreatments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground font-semibold">
                          No treatment sessions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="text-xs text-muted-foreground">
                Showing {filteredTreatments.length} of {totalTreatments} records
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

      {/* ------------------ VIEW: DETAILS / SUMMARY ------------------ */}
      {view === 'detail' && (
        <div className="space-y-6">
          {isLoadingDetail || !detail ? (
            <div className="h-[200px] flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading summary...</p>
            </div>
          ) : (
            <div className="space-y-6 print-container">
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-4 print:hidden">
                <div>
                  <button
                    onClick={() => {
                      setView('list');
                      setSelectedTreatmentId(null);
                    }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
                  >
                    <ChevronLeft size={12} /> Back to History
                  </button>
                  <h2 className="text-xl font-bold text-foreground">Treatment Summary Card</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold hover:bg-muted flex items-center gap-2 shadow-sm text-foreground bg-surface"
                  >
                    <Printer size={14} /> Print Summary
                  </button>
                  {detail.treatmentPlan && (
                    <button
                      onClick={() => navigate('/treatment-plans')}
                      className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                    >
                      <Info size={14} /> View Plan
                    </button>
                  )}
                  {canModify && (
                    <button
                      onClick={handleEditTreatment}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                    >
                      <Edit size={14} /> Edit Summary
                    </button>
                  )}
                </div>
              </div>

              {/* Printable Header */}
              <div className="hidden print:block text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">DentalFlow Clinical Summary</h1>
                <p className="text-sm text-muted-foreground">Recorded Dental Treatment Assessment</p>
              </div>

              {/* Patient context card */}
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Session Date</span>
                  <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                    <Calendar size={13} className="text-muted-foreground" />
                    {new Date(detail.sessionDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoiced Cost</span>
                  <span className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <DollarSign size={13} />
                    {Number(detail.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attending Doctor</span>
                  <span className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                    <Stethoscope size={13} className="text-muted-foreground" />
                    {detail.doctor?.name || detail.doctor?.user?.name}
                  </span>
                </div>
              </div>

              {/* Main Content Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left columns - Summary & Procedure Notes */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary details */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                      <FileText className="text-primary w-4 h-4" /> Procedure Details
                    </h4>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Treatment Performed</span>
                      <p className="text-base font-bold text-foreground">{detail.treatmentName}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Procedure Notes</span>
                      <p className="text-xs text-muted-foreground bg-surface p-3 rounded-lg border border-outline-variant leading-relaxed">
                        {detail.procedure || 'No detailed procedure notes recorded.'}
                      </p>
                    </div>

                    {detail.notes && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Clinical Observations / General Notes</span>
                        <p className="text-xs text-muted-foreground bg-surface p-3 rounded-lg border border-outline-variant leading-relaxed">
                          {detail.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column - Dental chart highlight */}
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2">
                      Tooth Chart Mapping
                    </h4>
                    {detail.toothNumber ? (
                      <ToothGrid selected={detail.toothNumber} readOnly />
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground italic border border-dashed border-outline-variant rounded-xl">
                        General treatment session (not mapped to a specific tooth).
                      </div>
                    )}
                  </div>

                  {detail.treatmentPlan && (
                    <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2">
                        Associated Plan
                      </h4>
                      <h5 className="text-xs font-bold text-foreground">{detail.treatmentPlan.title}</h5>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Plan Status: {detail.treatmentPlan.status}
                      </span>
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
            <h2 className="text-xl font-bold text-foreground">Record Treatment Session</h2>
          </div>

          <form onSubmit={handleSubmitCreate(handleCreateSubmit as any)} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-4xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form inputs */}
              <div className="space-y-4">
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
                        onChange={(e) => {
                          setActivePatientId(e.target.value);
                          registerCreate('patientId').onChange(e);
                        }}
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

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Associated Treatment Plan <span className="text-error">*</span>
                    </label>
                    <select
                      {...registerCreate('treatmentPlanId')}
                      disabled={!activePatientId}
                      className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs h-[72px]"
                    >
                      <option value="">-- Select Plan --</option>
                      {treatmentPlans.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {tp.title} ({tp.status})
                        </option>
                      ))}
                    </select>
                    {!activePatientId && (
                      <p className="text-[10px] text-muted-foreground mt-1 italic">
                        Select a patient first to see plans.
                      </p>
                    )}
                    {errorsCreate.treatmentPlanId && (
                      <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errorsCreate.treatmentPlanId.message}
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
                      className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
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

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Treatment Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Composite Restoration, Simple Extraction, Scaling..."
                    {...registerCreate('treatmentName')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {errorsCreate.treatmentName && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errorsCreate.treatmentName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Price Charged ($) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...registerCreate('price', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {errorsCreate.price && (
                      <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errorsCreate.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Session Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...registerCreate('sessionDate')}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {errorsCreate.sessionDate && (
                      <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errorsCreate.sessionDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Procedure Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed description of procedures performed..."
                    {...registerCreate('procedure')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    General Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter any general observations..."
                    {...registerCreate('notes')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Tooth selector */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Affected Tooth (Optional)
                </label>
                <ToothGrid selected={selectedTooth} onSelect={setSelectedTooth} />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
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
                Complete & Record Session
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
            <h2 className="text-xl font-bold text-foreground">Edit Treatment Session Summary</h2>
          </div>

          <form onSubmit={handleSubmitEdit(handleEditSubmit as any)} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-4xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Treatment Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerEdit('treatmentName')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  {errorsEdit.treatmentName && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errorsEdit.treatmentName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Price Charged ($) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...registerEdit('price', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {errorsEdit.price && (
                      <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errorsEdit.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Session Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...registerEdit('sessionDate')}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    {errorsEdit.sessionDate && (
                      <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errorsEdit.sessionDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Procedure Notes
                  </label>
                  <textarea
                    rows={4}
                    {...registerEdit('procedure')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    General Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    {...registerEdit('notes')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Tooth chart */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Affected Tooth (Optional)
                </label>
                <ToothGrid selected={selectedTooth} onSelect={setSelectedTooth} />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
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
