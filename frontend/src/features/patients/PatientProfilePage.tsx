import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Calendar,
  Trash2,
  Download,
  File,
  Activity,
  DollarSign,
  Upload,
  ClipboardList,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { getPatientProfile } from './api';
import { createAttachment, deleteAttachment, downloadAttachment } from '../attachments/api';
import { useAuth } from '@/features/authentication/context';

type ActiveTab = 'overview' | 'appointments' | 'treatment-plans' | 'attachments' | 'payments';

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'X_Ray' | 'Prescription' | 'Images'>('X_Ray');
  const [attachmentNotes, setAttachmentNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isDoctor = user?.role === 'DOCTOR';
  const canModify = isAdmin || isReceptionist;

  // Fetch patient profile
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['patient-profile', id],
    queryFn: () => getPatientProfile(id!),
    enabled: !!id,
  });

  const profile = response?.data;

  // Add Attachment Mutation
  const addAttachmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return createAttachment(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', id] });
      toast.success('File attachment added successfully');
      setIsAttachmentModalOpen(false);
      setSelectedFile(null);
      setAttachmentNotes('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload attachment');
    },
  });

  // Delete Attachment Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      return deleteAttachment(attachmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', id] });
      toast.success('Attachment deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete attachment');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileType', selectedFileType);
    formData.append('notes', attachmentNotes);
    formData.append('patientId', id!);
    // Associated doctorId (fallback to user id if doctor, otherwise any placeholder)
    formData.append('doctorId', isDoctor ? String(user?.id || '') : '');

    addAttachmentMutation.mutate(formData);
  };

  const handleDownloadFile = async (attachmentId: string, fileName: string) => {
    try {
      await downloadAttachment(attachmentId, fileName);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground py-20">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
        <p className="text-sm font-semibold">Loading patient comprehensive record...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-error" />
        <h3 className="text-lg font-bold text-foreground">Patient Profile Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested patient record may have been deleted or does not exist.</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalAppointments = profile.appointments?.length || 0;
  const totalTreatmentSessions = profile.treatments?.length || 0;
  const outstandingBalance = profile.balance || 0;
  const totalAttachments = profile.attachments?.length || 0;

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profile Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-all"
            title="Back to directory"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
            profile.gender === 'Male'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
          }`}>
            {profile.fullName
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-foreground">{profile.fullName}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                profile.status === 'Active'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                  : 'bg-muted/60 dark:bg-muted-950 text-muted-foreground border-outline-variant'
              }`}>
                {profile.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Patient ID: <span className="font-mono font-bold text-foreground">PT-{profile.id.substring(0, 8).toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canModify && (
            <button
              onClick={() => navigate('/patients')}
              className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-card hover:bg-surface-container-low text-foreground transition-all flex items-center gap-2"
            >
              Update Registration
            </button>
          )}
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="bg-card border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Appointments</span>
            <h4 className="text-xl font-black text-foreground mt-1">{totalAppointments}</h4>
          </div>
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
            <Calendar size={18} />
          </div>
        </div>

        {/* Treatment Sessions */}
        <div className="bg-card border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Treatments</span>
            <h4 className="text-xl font-black text-foreground mt-1">{totalTreatmentSessions}</h4>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Activity size={18} />
          </div>
        </div>

        {/* Account Outstanding Balance */}
        <div className="bg-card border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ledger Balance</span>
            <h4 className={`text-xl font-black mt-1 ${outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              EGP {outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h4>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Total File Attachments */}
        <div className="bg-card border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attachments</span>
            <h4 className="text-xl font-black text-foreground mt-1">{totalAttachments}</h4>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
            <File size={18} />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="border-b border-outline-variant flex overflow-x-auto custom-scrollbar">
          {(['overview', 'appointments', 'treatment-plans', 'attachments', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-bold border-b-2 capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="bg-card border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                  <User size={16} className="text-primary" /> Demographics & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Date of Birth</span>
                    <span className="font-semibold text-foreground text-xs">
                      {new Date(profile.dateOfBirth).toLocaleDateString([], { dateStyle: 'long' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Phone Number</span>
                    <span className="font-semibold text-foreground text-xs">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="font-semibold text-foreground text-xs">{profile.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Gender</span>
                    <span className="font-semibold text-foreground text-xs">{profile.gender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Blood Group</span>
                    <span className="font-semibold text-foreground text-xs">{profile.bloodGroup || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Home Address</span>
                    <span className="font-semibold text-foreground text-xs">{profile.address || 'No registered address'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-foreground border-b border-outline-variant pb-2 flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary" /> Medical Profile & Clinical History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="p-4 bg-rose-500/5 border border-rose-200 dark:border-rose-950 rounded-lg">
                    <span className="font-bold text-rose-800 dark:text-rose-300 text-xs block mb-1">Known Allergies</span>
                    <p className="text-rose-900/80 dark:text-rose-200 text-xs font-medium">
                      {profile.allergies || 'No known allergies reported.'}
                    </p>
                  </div>
                  <div className="p-4 bg-surface border border-outline-variant rounded-lg">
                    <span className="font-bold text-foreground text-xs block mb-1">Medical History</span>
                    <p className="text-muted-foreground text-xs font-medium">
                      {profile.medicalHistory || 'No major medical history conditions registered.'}
                    </p>
                  </div>
                  <div className="p-4 bg-surface border border-outline-variant rounded-lg md:col-span-2">
                    <span className="font-bold text-foreground text-xs block mb-1">General Notes & Observations</span>
                    <p className="text-muted-foreground text-xs font-medium">
                      {profile.notes || 'No general notes recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-card border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Appointment Schedule Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-6">Scheduled Date</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Attending Dentist</th>
                      <th className="p-3">Reason / Chief Complaint</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-6">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-xs">
                    {profile.appointments && profile.appointments.length > 0 ? (
                      profile.appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-6 font-semibold text-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                          <td className="p-3 text-muted-foreground flex items-center gap-1">
                            <Clock size={12} /> {apt.appointmentTime}
                          </td>
                          <td className="p-3 text-foreground font-medium">{apt.doctorName}</td>
                          <td className="p-3 text-muted-foreground">{apt.reason || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : apt.status === 'Scheduled'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                : apt.status === 'Cancelled'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="p-3 pr-6 text-muted-foreground max-w-[200px] truncate" title={apt.notes || ''}>
                            {apt.notes || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          No appointments scheduled or recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'treatment-plans' && (
            <div className="space-y-6">
              {/* Treatment Plans Card list */}
              <div className="bg-card border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Active & Historical Treatment Plans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="p-3 pl-6">Created Date</th>
                        <th className="p-3">Plan Title</th>
                        <th className="p-3">Estimated Sessions</th>
                        <th className="p-3">Dentist</th>
                        <th className="p-3">Estimated Cost</th>
                        <th className="p-3 pr-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-xs">
                      {profile.treatmentPlans && profile.treatmentPlans.length > 0 ? (
                        profile.treatmentPlans.map((plan) => (
                          <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 pl-6 text-muted-foreground">
                              {new Date(plan.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                            </td>
                            <td className="p-3 font-semibold text-foreground">
                              <div>{plan.title}</div>
                              {plan.description && <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{plan.description}</div>}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {plan.completedSessions} / {plan.estimatedSessions} sessions
                            </td>
                            <td className="p-3 text-foreground font-medium">{plan.doctorName}</td>
                            <td className="p-3 font-semibold text-foreground">EGP {plan.estimatedCost.toLocaleString()}</td>
                            <td className="p-3 pr-6">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                plan.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : plan.status === 'InProgress'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : plan.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-muted text-muted-foreground border-outline-variant'
                              }`}>
                                {plan.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            No treatment plans created for this patient.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Treatment Session Logs */}
              <div className="bg-card border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Clinical Treatment Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="p-3 pl-6">Session Date</th>
                        <th className="p-3">Treatment Plan</th>
                        <th className="p-3">Procedure Name</th>
                        <th className="p-3">Tooth #</th>
                        <th className="p-3">Dentist</th>
                        <th className="p-3">Charged Price</th>
                        <th className="p-3 pr-6">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-xs">
                      {profile.treatments && profile.treatments.length > 0 ? (
                        profile.treatments.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 pl-6 font-medium text-foreground">
                              {new Date(tx.sessionDate).toLocaleDateString([], { dateStyle: 'medium' })}
                            </td>
                            <td className="p-3 text-muted-foreground font-semibold">
                              {tx.treatmentPlan?.title || 'Standalone Treatment'}
                            </td>
                            <td className="p-3 font-semibold text-foreground">{tx.treatmentName}</td>
                            <td className="p-3 font-mono font-bold text-primary">{tx.toothNumber !== null ? `#${tx.toothNumber}` : '—'}</td>
                            <td className="p-3 text-foreground font-medium">{tx.doctorName}</td>
                            <td className="p-3 font-semibold text-foreground">EGP {tx.price.toLocaleString()}</td>
                            <td className="p-3 pr-6 text-muted-foreground max-w-[200px] truncate" title={tx.notes || ''}>
                              {tx.notes || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-muted-foreground">
                            No treatment sessions logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-card border border-outline-variant p-4 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Dental Scans & Attachments</h3>
                  <p className="text-xs text-muted-foreground">Prescriptions, radiology reports, and pre/post-op X-Rays.</p>
                </div>
                {(isAdmin || isDoctor) && (
                  <button
                    onClick={() => setIsAttachmentModalOpen(true)}
                    className="bg-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all flex items-center gap-2"
                  >
                    <Upload size={14} /> Add Attachment
                  </button>
                )}
              </div>

              {/* Attachments list / grid */}
              {profile.attachments && profile.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.attachments.map((file) => (
                    <div key={file.id} className="bg-card border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                          <File size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground text-xs truncate" title={file.fileName}>
                            {file.fileName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-surface border border-outline-variant text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              {file.fileType.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {file.notes && (
                            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2" title={file.notes}>
                              {file.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-outline-variant pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>Dentist: {file.doctorName}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDownloadFile(file.id, file.fileName)}
                            className="p-1 text-muted-foreground hover:text-primary transition-all hover:bg-primary/10 rounded"
                            title="Download file"
                          >
                            <Download size={14} />
                          </button>
                          {(isAdmin || isDoctor) && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to permanently delete this file attachment?')) {
                                  deleteAttachmentMutation.mutate(file.id);
                                }
                              }}
                              className="p-1 text-muted-foreground hover:text-error transition-all hover:bg-error/10 rounded"
                              title="Delete attachment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-outline-variant rounded-xl p-8 text-center text-muted-foreground">
                  <File className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-xs font-semibold">No documents, scans, or prescriptions uploaded.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-card border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Payment Ledger History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3 pl-6">Payment Date</th>
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Charged Doctor</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 pr-6 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-xs">
                    {profile.payments && profile.payments.length > 0 ? (
                      profile.payments.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-6 font-medium text-foreground">
                            {new Date(pmt.paymentDate).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                          <td className="p-3 font-mono font-bold text-foreground">{pmt.invoiceNumber}</td>
                          <td className="p-3 text-muted-foreground">
                            <span className="px-2 py-0.5 rounded bg-surface border border-outline-variant font-bold text-[9px] uppercase tracking-wider">
                              {pmt.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-foreground font-medium">{pmt.doctorName}</td>
                          <td className="p-3 text-muted-foreground">{pmt.notes || '—'}</td>
                          <td className="p-3 pr-6 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            EGP {pmt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          No financial transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Upload Modal */}
      {isAttachmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-sm font-extrabold text-foreground mb-4">Upload Patient File Attachment</h3>
            <form onSubmit={handleUploadAttachment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Attachment Type
                </label>
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-card border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="X_Ray">Radiology X-Ray</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Images">Clinical Image / Photo</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  File Upload
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-card border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Clinical Notes / Descriptions
                </label>
                <textarea
                  value={attachmentNotes}
                  onChange={(e) => setAttachmentNotes(e.target.value)}
                  placeholder="e.g. Right lower molar post-op CBCT scan"
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentModalOpen(false);
                    setSelectedFile(null);
                    setAttachmentNotes('');
                  }}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold bg-card hover:bg-surface-container-low text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAttachmentMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1 shadow-sm"
                >
                  {addAttachmentMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin w-3 h-3" /> Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
