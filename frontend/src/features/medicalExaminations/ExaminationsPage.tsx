import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  FileText,
  Activity,
  Save,
  Printer,
  Paperclip,
  Trash2,
  Edit,
  AlertCircle,
  Stethoscope,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FileDown,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getExaminations,
  getExamination,
  createExamination,
  updateExamination,
  getDoctors,
  getPatients,
  getAttachments,
  uploadAttachment,
  deleteAttachment,
} from './api';

// Teeth FDI definitions
const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];
const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

interface ToothFinding {
  status: 'Caries' | 'Restoration' | 'Extracted' | 'Crown' | 'Healthy';
  notes: string;
}

// Zod validation schema
const formSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  doctorId: z.string().uuid('Please select a doctor').optional(),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  clinicalNotes: z.string().optional(),
  radiologyNotes: z.string().optional(),
  prescription: z.string().optional(),
  recommendations: z.string().optional(),
  examDate: z.string().optional(),
  // Vitals helper fields (will be structured into clinicalNotes)
  bp: z.string().optional(),
  hr: z.string().optional(),
  temp: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ExaminationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Navigation / View State
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Filters / Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [page, setPage] = useState(1);

  // Form search state
  const [patientSearch, setPatientSearch] = useState('');

  // FDI Tooth finding states
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [toothFindings, setToothFindings] = useState<Record<string, ToothFinding>>({});
  const [currentToothStatus, setCurrentToothStatus] = useState<ToothFinding['status']>('Healthy');
  const [currentToothNotes, setCurrentToothNotes] = useState('');

  // Prescription builder state
  interface MedRow {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }
  const [meds, setMeds] = useState<MedRow[]>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medDuration, setMedDuration] = useState('');

  // Attachment upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'X_Ray' | 'Prescription' | 'Images'>('X_Ray');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Role checks
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isAdmin = user?.role === 'ADMIN';

  // Fetch collections
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: !isReceptionist,
  });
  const doctors = doctorsData?.data || [];

  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients({ search: patientSearch, limit: 100 }),
    enabled: !isReceptionist && view !== 'list',
  });
  const patients = patientsData?.data?.patients || [];

  // Fetch list of examinations
  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ['examinations', page, selectedPatientId, selectedDoctorId],
    queryFn: () =>
      getExaminations({
        page,
        limit: 10,
        patientId: selectedPatientId || undefined,
        doctorId: selectedDoctorId || undefined,
      }),
    enabled: !isReceptionist,
  });
  const examinations = examsData?.data?.examinations || [];
  const pagination = examsData?.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };

  // Fetch detailed examination
  const { data: detailRes, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['examination', selectedExamId],
    queryFn: () => getExamination(selectedExamId!),
    enabled: !!selectedExamId && (view === 'detail' || view === 'edit'),
  });
  const detail = detailRes?.data;

  // Fetch attachments list (for current doctor/general)
  const { data: attachmentsRes, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments'],
    queryFn: () => getAttachments({ limit: 100 }),
    enabled: !isReceptionist && view === 'detail',
  });
  const attachments = attachmentsRes?.data?.attachments || [];

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Actions allowed
  const canModify = isAdmin || user?.role === 'DOCTOR';

  // Mutations
  const createMutation = useMutation({
    mutationFn: createExamination,
    onSuccess: (response) => {
      toast.success(response.message || 'Medical examination recorded.');
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setView('list');
      setSelectedExamId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record examination.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateExamination(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Medical examination updated.');
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setView('list');
      setSelectedExamId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update examination.');
    },
  });

  // Access denied fallback for Receptionists
  if (isReceptionist) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
        <ShieldAlert className="w-16 h-16 text-error mb-4" />
        <h3 className="text-xl font-bold text-foreground">Access Denied</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Medical Examinations contain sensitive clinical charts and vitals. Only Doctors and Administrators have clearance to access this module.
        </p>
      </div>
    );
  }

  // Filter examinations locally by search query (patient/doctor name)
  const filteredExaminations = examinations.filter((exam) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patientName = exam.patient?.fullName?.toLowerCase() || '';
    const doctorName = exam.doctor?.name?.toLowerCase() || '';
    const diagnosis = exam.diagnosis?.toLowerCase() || '';
    return patientName.includes(query) || doctorName.includes(query) || diagnosis.includes(query);
  });

  // Switch to Create view
  const handleNewExam = () => {
    reset({
      patientId: '',
      doctorId: user ? String(user.id) : '',
      chiefComplaint: '',
      diagnosis: '',
      clinicalNotes: '',
      radiologyNotes: '',
      prescription: '',
      recommendations: '',
      examDate: new Date().toISOString().split('T')[0],
      bp: '',
      hr: '',
      temp: '',
    });
    setToothFindings({});
    setMeds([]);
    setSelectedTooth(null);
    setView('create');
  };

  // Switch to Edit view
  const handleEditExam = () => {
    if (!detail) return;
    
    // Parse vitals if they exist in clinicalNotes
    // (Assume standard format: "BP: 120/80 mmHg | HR: 72 bpm | Temp: 98.6 F\n\nNotes: ...")
    let bp = '';
    let hr = '';
    let temp = '';
    let clinicalText = detail.clinicalNotes || '';
    
    if (clinicalText.startsWith('Vitals:')) {
      const matchBp = clinicalText.match(/BP: ([\d/]+)/);
      const matchHr = clinicalText.match(/HR: (\d+)/);
      const matchTemp = clinicalText.match(/Temp: ([\d.]+)/);
      
      if (matchBp) bp = matchBp[1];
      if (matchHr) hr = matchHr[1];
      if (matchTemp) temp = matchTemp[1];

      // Remove the Vitals line from clinicalText
      const lines = clinicalText.split('\n');
      if (lines.length > 2) {
        clinicalText = lines.slice(2).join('\n');
      }
    }

    // Try to parse tooth findings from clinicalNotes
    const toothFindingsParsed: Record<string, ToothFinding> = {};
    const findingsMatch = clinicalText.match(/Tooth Findings:\n([\s\S]*?)(?=\n\n|$)/);
    if (findingsMatch) {
      const findingsLines = findingsMatch[1].split('\n');
      findingsLines.forEach((line) => {
        const parts = line.match(/Tooth (\d+): (\w+)(?: \((.*?)\))?/);
        if (parts) {
          const toothNum = parts[1];
          const status = parts[2] as ToothFinding['status'];
          const notes = parts[3] || '';
          toothFindingsParsed[toothNum] = { status, notes };
        }
      });
      
      // Clean findings from clinicalText for editing
      clinicalText = clinicalText.replace(/Tooth Findings:\n[\s\S]*?(?=\n\n|$)/, '').trim();
    }

    // Parse prescription rows
    const medsParsed: MedRow[] = [];
    if (detail.prescription) {
      const rows = detail.prescription.split('\n');
      rows.forEach((r) => {
        const match = r.match(/^(.*?) - (.*?) \(Freq: (.*?), Dur: (.*?)\)$/);
        if (match) {
          medsParsed.push({
            name: match[1],
            dosage: match[2],
            frequency: match[3],
            duration: match[4],
          });
        }
      });
    }

    reset({
      patientId: detail.patientId,
      doctorId: detail.doctorId,
      chiefComplaint: detail.chiefComplaint,
      diagnosis: detail.diagnosis,
      clinicalNotes: clinicalText,
      radiologyNotes: detail.radiologyNotes || '',
      prescription: detail.prescription || '',
      recommendations: detail.recommendations || '',
      examDate: detail.examDate ? new Date(detail.examDate).toISOString().split('T')[0] : '',
      bp,
      hr,
      temp,
    });

    setToothFindings(toothFindingsParsed);
    setMeds(medsParsed);
    setSelectedTooth(null);
    setView('edit');
  };

  // FDI tooth selector panel controls
  const handleSelectTooth = (tooth: string) => {
    setSelectedTooth(tooth);
    const existing = toothFindings[tooth];
    if (existing) {
      setCurrentToothStatus(existing.status);
      setCurrentToothNotes(existing.notes);
    } else {
      setCurrentToothStatus('Healthy');
      setCurrentToothNotes('');
    }
  };

  const handleSaveToothFinding = () => {
    if (!selectedTooth) return;
    if (currentToothStatus === 'Healthy') {
      const copy = { ...toothFindings };
      delete copy[selectedTooth];
      setToothFindings(copy);
    } else {
      setToothFindings({
        ...toothFindings,
        [selectedTooth]: { status: currentToothStatus, notes: currentToothNotes },
      });
    }
    setSelectedTooth(null);
    toast.success(`Tooth ${selectedTooth} findings updated.`);
  };

  // Prescription builder table controls
  const handleAddMed = () => {
    if (!medName.trim()) return;
    setMeds([...meds, { name: medName, dosage: medDosage, frequency: medFrequency, duration: medDuration }]);
    setMedName('');
    setMedDosage('');
    setMedFrequency('');
    setMedDuration('');
  };

  const handleRemoveMed = (index: number) => {
    setMeds(meds.filter((_, i) => i !== index));
  };

  // Attachment upload controls
  const handleUploadAttachment = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('fileType', uploadType);
      formData.append('notes', uploadNotes);
      // Backend expects doctorId from auth or parameter
      if (isAdmin && doctors.length > 0) {
        formData.append('doctorId', detail?.doctorId || doctors[0].id);
      }
      await uploadAttachment(formData);
      toast.success('File uploaded successfully.');
      setUploadFile(null);
      setUploadNotes('');
      refetchAttachments();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (confirm('Delete this file attachment?')) {
      try {
        await deleteAttachment(id);
        toast.success('Attachment deleted.');
        refetchAttachments();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete attachment.');
      }
    }
  };

  // Form submit handler
  const onSubmit = (values: FormValues) => {
    // Structure vitals line
    let formattedClinicalNotes = '';
    if (values.bp || values.hr || values.temp) {
      formattedClinicalNotes += `Vitals: BP: ${values.bp || 'N/A'} | HR: ${values.hr || 'N/A'} bpm | Temp: ${values.temp || 'N/A'} F\n\n`;
    }

    // Append tooth findings
    if (Object.keys(toothFindings).length > 0) {
      formattedClinicalNotes += 'Tooth Findings:\n';
      Object.entries(toothFindings).forEach(([tooth, finding]) => {
        formattedClinicalNotes += `Tooth ${tooth}: ${finding.status}${finding.notes ? ` (${finding.notes})` : ''}\n`;
      });
      formattedClinicalNotes += '\n';
    }

    // Append clinical observations text
    formattedClinicalNotes += values.clinicalNotes || '';

    // Structure prescriptions list
    const formattedPrescriptions = meds
      .map((m) => `${m.name} - ${m.dosage} (Freq: ${m.frequency}, Dur: ${m.duration})`)
      .join('\n');

    const payload = {
      patientId: values.patientId,
      doctorId: values.doctorId || (user ? String(user.id) : ''),
      chiefComplaint: values.chiefComplaint,
      diagnosis: values.diagnosis,
      clinicalNotes: formattedClinicalNotes || null,
      radiologyNotes: values.radiologyNotes || null,
      prescription: formattedPrescriptions || null,
      recommendations: values.recommendations || null,
      examDate: values.examDate ? new Date(values.examDate).toISOString() : new Date().toISOString(),
    };

    if (view === 'edit' && selectedExamId) {
      // Remove patientId since it cannot be changed on update
      const { patientId, ...updatePayload } = payload;
      updateMutation.mutate({ id: selectedExamId, data: updatePayload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Calculate FDI tooth indicator classes
  const getToothClass = (tooth: string) => {
    const finding = toothFindings[tooth];
    if (selectedTooth === tooth) return 'border-2 border-primary ring-2 ring-primary bg-primary/10';
    if (!finding) return 'border-outline-variant bg-surface-container-lowest text-foreground';
    switch (finding.status) {
      case 'Caries':
        return 'border-error bg-error/15 text-error font-bold';
      case 'Restoration':
        return 'border-primary bg-primary/15 text-primary font-bold';
      case 'Extracted':
        return 'border-outline bg-muted text-muted-foreground line-through opacity-40';
      case 'Crown':
        return 'border-tertiary bg-tertiary/15 text-tertiary font-bold';
      default:
        return 'border-outline-variant bg-surface-container-lowest text-foreground';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ------------------ VIEW: EXAMINATION LIST ------------------ */}
      {view === 'list' && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Top header controls */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-foreground">Medical Examinations</h2>
              <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
              <div className="flex gap-2">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- Filter Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- Filter Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-48"
                />
              </div>
              {canModify && (
                <button
                  onClick={handleNewExam}
                  className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Record Exam
                </button>
              )}
            </div>
          </div>

          {/* List Table */}
          <div className="flex-1 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            {isLoadingExams ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
                <p className="text-sm font-semibold">Loading examinations...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-4">Patient</th>
                      <th className="p-3">Attending Doctor</th>
                      <th className="p-3">Chief Complaint</th>
                      <th className="p-3">Primary Diagnosis</th>
                      <th className="p-3">Exam Date</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                    {filteredExaminations.map((exam) => (
                      <tr key={exam.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-3 pl-4 font-semibold">{exam.patient?.fullName}</td>
                        <td className="p-3">{exam.doctor?.name}</td>
                        <td className="p-3 max-w-[200px] truncate text-muted-foreground">
                          {exam.chiefComplaint}
                        </td>
                        <td className="p-3 max-w-[200px] truncate font-medium text-foreground">
                          {exam.diagnosis}
                        </td>
                        <td className="p-3">
                          {new Date(exam.examDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedExamId(exam.id);
                              setView('detail');
                            }}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded text-[11px] transition-colors"
                          >
                            View Record
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExaminations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground font-semibold">
                          No clinical examinations recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="text-xs text-muted-foreground">
                Showing {filteredExaminations.length} of {pagination.total} records
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
                  Page {page} of {pagination.pages}
                </span>
                <button
                  disabled={page >= pagination.pages}
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

      {/* ------------------ VIEW: EXAMINATION DETAILS / PRINT VIEW ------------------ */}
      {view === 'detail' && (
        <div className="space-y-6">
          {isLoadingDetail || !detail ? (
            <div className="h-[200px] flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-4 print:hidden">
                <div>
                  <button
                    onClick={() => {
                      setView('list');
                      setSelectedExamId(null);
                    }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
                  >
                    <ChevronLeft size={12} /> Back to Directory
                  </button>
                  <h2 className="text-xl font-bold text-foreground">Examination Record</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low flex items-center gap-2 shadow-sm"
                  >
                    <Printer size={14} /> Print Record
                  </button>
                  {canModify && (
                    <button
                      onClick={handleEditExam}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-2 shadow-sm"
                    >
                      <Edit size={14} /> Edit Record
                    </button>
                  )}
                </div>
              </div>

              {/* Printable header */}
              <div className="hidden print:flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-primary">DentalFlow Clinic Suite</h1>
                  <p className="text-xs text-muted-foreground">Clinical Diagnostic & Assessment Report</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">Date: {new Date(detail.examDate).toLocaleDateString()}</p>
                  <p className="text-muted-foreground">ID: {detail.id.substring(0, 8)}</p>
                </div>
              </div>

              {/* Patient Context Card */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 flex flex-wrap gap-x-8 gap-y-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {detail.patient?.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{detail.patient?.fullName}</h3>
                    <p className="text-xs text-muted-foreground">Patient ID: {detail.patientId.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date of Exam</span>
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar size={13} className="text-muted-foreground" />
                    {new Date(detail.examDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-12 bg-outline-variant"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attending Clinician</span>
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Stethoscope size={13} className="text-muted-foreground" />
                    {detail.doctor?.name}
                  </span>
                </div>
              </div>

              {/* Main Info Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Columns - Medical Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Chief Complaint */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                      <FileText className="text-primary w-4 h-4" /> Chief Complaint
                    </h4>
                    <p className="text-xs text-foreground bg-surface p-3 rounded-lg border border-outline-variant font-medium leading-relaxed">
                      {detail.chiefComplaint}
                    </p>
                  </div>

                  {/* Vitals Signs Card (if parsed in clinicalNotes) */}
                  {detail.clinicalNotes?.startsWith('Vitals:') && (
                    <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                        <Activity className="text-primary w-4 h-4" /> Patient Vital Signs
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-surface p-3 rounded-lg border border-outline-variant">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">BP</span>
                          <p className="text-sm font-bold text-foreground mt-1">
                            {detail.clinicalNotes.match(/BP: ([\d/]+)/)?.[1] || 'N/A'}
                          </p>
                        </div>
                        <div className="bg-surface p-3 rounded-lg border border-outline-variant">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Heart Rate</span>
                          <p className="text-sm font-bold text-foreground mt-1">
                            {detail.clinicalNotes.match(/HR: (\d+)/)?.[1] || 'N/A'} bpm
                          </p>
                        </div>
                        <div className="bg-surface p-3 rounded-lg border border-outline-variant">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Temp</span>
                          <p className="text-sm font-bold text-foreground mt-1">
                            {detail.clinicalNotes.match(/Temp: ([\d.]+)/)?.[1] || 'N/A'} °F
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diagnosis & Recommendations */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                      <FileText className="text-primary w-4 h-4" /> Diagnoses & Plans
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Diagnosis</span>
                        <p className="text-xs text-foreground bg-surface p-3 rounded-lg border border-outline-variant font-bold mt-1.5">
                          {detail.diagnosis}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clinical Notes</span>
                        <p className="text-xs text-muted-foreground bg-surface p-3 rounded-lg border border-outline-variant mt-1.5 italic min-h-[50px] whitespace-pre-line">
                          {detail.clinicalNotes?.replace(/Vitals:[\s\S]*?\n\n/, '').replace(/Tooth Findings:[\s\S]*?\n\n/, '').trim() || 'No additional notes recorded'}
                        </p>
                      </div>
                    </div>

                    {detail.recommendations && (
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recommendations & Advice</span>
                        <p className="text-xs text-foreground bg-surface p-3 rounded-lg border border-outline-variant font-medium mt-1.5 leading-relaxed">
                          {detail.recommendations}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prescriptions (Table) */}
                  {detail.prescription && (
                    <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden space-y-3">
                      <div className="p-5 border-b border-outline-variant bg-surface-container-lowest">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <FileText className="text-primary w-4 h-4" /> Prescribed Medications
                        </h4>
                      </div>
                      <div className="overflow-x-auto p-4 pt-0">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <th className="p-3">Medication Name</th>
                              <th className="p-3">Dosage</th>
                              <th className="p-3">Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.prescription.split('\n').map((med, idx) => {
                              const match = med.match(/^(.*?) - (.*?) \(Freq: (.*?), Dur: (.*?)\)$/);
                              if (!match) return null;
                              return (
                                <tr key={idx} className="border-b border-outline-variant hover:bg-surface">
                                  <td className="p-3 font-semibold text-foreground">{match[1]}</td>
                                  <td className="p-3 font-medium text-foreground">{match[2]}</td>
                                  <td className="p-3 text-muted-foreground">
                                    Take every {match[3]} for {match[4]}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar - FDI Teeth Findings & File Attachments */}
                <div className="space-y-6">
                  {/* FDI tooth diagram summary */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                    <h5 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2">Teeth Chart Summary</h5>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {detail.clinicalNotes?.includes('Tooth Findings:') ? (
                        detail.clinicalNotes
                          .match(/Tooth Findings:\n([\s\S]*?)(?=\n\n|$)/)?.[1]
                          .split('\n')
                          .filter(Boolean)
                          .map((line, idx) => {
                            const match = line.match(/Tooth (\d+): (\w+)(?: \((.*?)\))?/);
                            if (!match) return null;
                            const status = match[2];
                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${
                                  status === 'Caries'
                                    ? 'bg-error/5 border-error/20 text-error'
                                    : status === 'Restoration'
                                    ? 'bg-primary/5 border-primary/20 text-primary'
                                    : 'bg-tertiary/5 border-tertiary/20 text-tertiary'
                                }`}
                              >
                                <div>
                                  <span className="font-bold">Tooth {match[1]}</span>
                                  {match[3] && <p className="text-[10px] opacity-80 mt-0.5">{match[3]}</p>}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No specific dental chart findings recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Radiology / X-Ray Observations */}
                  {detail.radiologyNotes && (
                    <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Radiology / Imaging Notes</span>
                      <p className="text-xs text-foreground bg-surface p-3 rounded-lg border border-outline-variant leading-relaxed">
                        {detail.radiologyNotes}
                      </p>
                    </div>
                  )}

                  {/* Attachments Section */}
                  <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4 print:hidden">
                    <h5 className="text-sm font-bold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primary" /> Radiology & Documents
                    </h5>

                    {/* Files list */}
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                      {attachments.map((file) => (
                        <div key={file.id} className="p-2 border border-outline-variant rounded-lg bg-surface flex justify-between items-center gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold truncate text-foreground">{file.fileName}</p>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{file.fileType}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <a
                              href={`/api/v1/attachments/${file.id}/download`}
                              download
                              className="p-1 border border-outline-variant hover:bg-primary/10 text-primary rounded"
                              title="Download file"
                            >
                              <FileDown size={14} />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-1 border border-outline-variant hover:bg-error/15 text-error rounded"
                              title="Delete file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {attachments.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No attachments uploaded yet</p>
                      )}
                    </div>

                    {/* File upload input */}
                    {canModify && (
                      <div className="border-t border-outline-variant pt-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={uploadType}
                            onChange={(e) => setUploadType(e.target.value as any)}
                            className="bg-surface border border-outline-variant rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary flex-1"
                          >
                            <option value="X_Ray">X-Ray Image</option>
                            <option value="Prescription">Prescription</option>
                            <option value="Images">Clinical Photo</option>
                          </select>
                        </div>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-primary/15 file:text-primary hover:file:brightness-95 cursor-pointer"
                        />
                        {uploadFile && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Notes (optional)..."
                              value={uploadNotes}
                              onChange={(e) => setUploadNotes(e.target.value)}
                              className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-xs focus:outline-none focus:border-primary"
                            />
                            <button
                              onClick={handleUploadAttachment}
                              disabled={isUploading}
                              className="w-full py-1 bg-primary text-primary-foreground rounded text-xs font-bold hover:brightness-95 disabled:opacity-50"
                            >
                              {isUploading ? 'Uploading...' : 'Save File'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ VIEW: CREATE / EDIT FORM ------------------ */}
      {(view === 'create' || view === 'edit') && (
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-outline-variant pb-4">
            <div>
              <button
                onClick={() => setView('list')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
              >
                <ChevronLeft size={12} /> Cancel & Return
              </button>
              <h2 className="text-xl font-bold text-foreground">
                {view === 'edit' ? 'Edit Examination' : 'New Clinical Examination'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left columns: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient and Doctor selectors */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Patient <span className="text-error">*</span>
                  </label>
                  {view === 'edit' && detail ? (
                    <div className="px-3 py-2 bg-muted rounded-lg text-xs text-foreground font-semibold border border-outline-variant">
                      {detail.patient?.fullName}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search patient..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
                      />
                      <select
                        {...register('patientId')}
                        className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                      >
                        <option value="">-- Select Patient --</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} ({p.phone})
                          </option>
                        ))}
                      </select>
                      {errors.patientId && (
                        <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.patientId.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    {...register('examDate')}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <FileText className="text-primary w-4 h-4" /> Chief Complaint <span className="text-error">*</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record the primary reason for the patient's visit..."
                  {...register('chiefComplaint')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
                {errors.chiefComplaint && (
                  <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.chiefComplaint.message}
                  </p>
                )}
              </div>

              {/* Patient Vital Signs */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <label className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                  <Activity className="text-primary w-4 h-4" /> Vital Signs (Optional)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      {...register('bp')}
                      className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="72"
                      {...register('hr')}
                      className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Temperature (°F)</label>
                    <input
                      type="text"
                      placeholder="98.6"
                      {...register('temp')}
                      className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* FDI Tooth Chart Findings */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <label className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                  <Stethoscope className="text-primary w-4 h-4" /> Clinical Findings & Odontogram (FDI)
                </label>

                {/* Simplified Odontogram grid */}
                <div className="bg-surface border border-dashed border-outline-variant rounded-lg p-4 space-y-4 select-none">
                  {/* Upper Row: 18 -> 11, 21 -> 28 */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {UPPER_TEETH.map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => handleSelectTooth(tooth)}
                        className={`w-8 h-10 rounded border flex flex-col items-center justify-between p-1 transition-all text-[10px] hover:scale-105 ${getToothClass(
                          tooth
                        )}`}
                      >
                        <span className="font-semibold">{tooth}</span>
                        <div className="w-3.5 h-3.5 rounded-full border border-current opacity-80 flex items-center justify-center">
                          {toothFindings[tooth]?.status?.charAt(0) || ''}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Divider line */}
                  <div className="border-t border-outline-variant border-dashed"></div>

                  {/* Lower Row: 48 -> 41, 31 -> 38 */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {LOWER_TEETH.map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => handleSelectTooth(tooth)}
                        className={`w-8 h-10 rounded border flex flex-col items-center justify-between p-1 transition-all text-[10px] hover:scale-105 ${getToothClass(
                          tooth
                        )}`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-current opacity-80 flex items-center justify-center">
                          {toothFindings[tooth]?.status?.charAt(0) || ''}
                        </div>
                        <span className="font-semibold">{tooth}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Tooth editor panel */}
                {selectedTooth && (
                  <div className="bg-surface p-4 border border-outline-variant rounded-lg space-y-3 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">
                        Record findings for Tooth {selectedTooth}:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTooth(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground font-semibold hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tooth Condition</label>
                        <select
                          value={currentToothStatus}
                          onChange={(e) => setCurrentToothStatus(e.target.value as any)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Healthy">Healthy (No findings)</option>
                          <option value="Caries">Caries / Decay</option>
                          <option value="Restoration">Existing Restoration</option>
                          <option value="Extracted">Missing / Extracted</option>
                          <option value="Crown">Crown / Bridge</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Observation Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Deep cavity, marginal leak..."
                          value={currentToothNotes}
                          onChange={(e) => setCurrentToothNotes(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveToothFinding}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-bold hover:brightness-95"
                      >
                        Apply Finding
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnoses, Clinical Notes & Radiology */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <label className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                  <FileText className="text-primary w-4 h-4" /> Diagnoses & Clinical Records
                </label>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Primary Diagnosis <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pulpitis, Caries, Periapical abscess..."
                    {...register('diagnosis')}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  {errors.diagnosis && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.diagnosis.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">General Observations</label>
                    <textarea
                      rows={4}
                      placeholder="Note clinical findings and observation notes..."
                      {...register('clinicalNotes')}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Radiology Observations (X-Ray)</label>
                    <textarea
                      rows={4}
                      placeholder="Describe any findings on intraoral, panoramic, or CBCT scans..."
                      {...register('radiologyNotes')}
                      className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Builder */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <label className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-outline-variant pb-2">
                  <FileText className="text-primary w-4 h-4" /> Prescription Builder (Optional)
                </label>

                {/* Medication inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface p-3 rounded-lg border border-outline-variant">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Medication Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin, Ibuprofen..."
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg, 400mg"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 cap every 8h"
                      value={medFrequency}
                      onChange={(e) => setMedFrequency(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 Days, 3 Days PRN"
                      value={medDuration}
                      onChange={(e) => setMedDuration(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="w-full py-1 bg-secondary text-white rounded text-xs font-bold hover:brightness-95 shadow-sm"
                    >
                      Add Med
                    </button>
                  </div>
                </div>

                {/* Med list table */}
                {meds.length > 0 && (
                  <div className="border border-outline-variant rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-container-low text-muted-foreground">
                        <tr className="border-b border-outline-variant text-[9px] font-bold uppercase">
                          <th className="p-2">Med</th>
                          <th className="p-2">Dosage</th>
                          <th className="p-2">Instructions</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meds.map((m, idx) => (
                          <tr key={idx} className="border-b border-outline-variant bg-surface-container-lowest hover:bg-surface">
                            <td className="p-2 font-semibold">{m.name}</td>
                            <td className="p-2">{m.dosage}</td>
                            <td className="p-2 text-muted-foreground">
                              Every {m.frequency} for {m.duration}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveMed(idx)}
                                className="text-error hover:scale-105"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                <label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FileText className="text-primary w-4 h-4" /> Doctor Recommendations & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Record post-appointment recommendations, hygiene guidelines, or clinical advices..."
                  {...register('recommendations')}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Right sidebar: Completion checker */}
            <div className="space-y-6">
              {/* Doctor assigning (required for admin, ignored for doctor) */}
              {isAdmin && (
                <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Assigning Attending Doctor <span className="text-error">*</span>
                  </label>
                  <select
                    {...register('doctorId')}
                    className="w-full px-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">-- Attending Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Checklist panel */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
                <h5 className="text-xs font-bold text-foreground border-b border-outline-variant pb-2">
                  Report Checklist
                </h5>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    Patient Identity selected
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    Chief Complaint specified
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                    Clinical findings updated
                  </li>
                </ul>
              </div>

              {/* Form submit/save actions */}
              <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-2.5">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save size={14} /> Save Examination
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="w-full py-2.5 border border-outline-variant rounded-lg text-xs font-bold bg-surface hover:bg-surface-container-low text-foreground transition-colors"
                >
                  Discard Draft
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
