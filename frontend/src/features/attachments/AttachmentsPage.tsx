import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  FileText,
  Activity,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import {
  getAttachments,
  createAttachment,
  deleteAttachment,
  getDoctors,
  downloadAttachment,
} from './api';
import type { Attachment } from './types';

// Secure Authenticated Image Component
function SecureImage({ attachmentId, alt, className }: { attachmentId: string; alt: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');

    setLoading(true);
    setError(false);

    fetch(`/api/v1/attachments/${attachmentId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load image');
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          setSrc(URL.createObjectURL(blob));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [attachmentId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
        <Loader2 className="animate-spin text-primary w-5 h-5" />
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-low text-muted-foreground text-xs font-semibold">
        No Preview
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}

export function AttachmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // States
  const [view, setView] = useState<'list' | 'upload'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [page, setPage] = useState(1);

  // Upload Form states
  const [uploadFileType, setUploadFileType] = useState<'X_Ray' | 'Prescription' | 'Images'>('X_Ray');
  const [uploadDoctorId, setUploadDoctorId] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Lightbox Viewer states
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [invert, setInvert] = useState(false);

  // Role permissions
  const isAdmin = user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR';
  const canModify = isAdmin || isDoctor;

  // Fetch doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: view === 'upload' || isAdmin,
  });
  const doctors = doctorsData?.data || [];

  // Fetch attachments list
  const { data: attachmentsData, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['attachments', page, selectedDoctorId, selectedFileType],
    queryFn: () =>
      getAttachments({
        page,
        limit: 10,
        doctorId: selectedDoctorId || undefined,
        fileType: (selectedFileType as any) || undefined,
      }),
  });
  const attachments = attachmentsData?.data?.attachments || [];
  const totalAttachments = attachmentsData?.data?.pagination?.total || 0;
  const totalPages = attachmentsData?.data?.pagination?.totalPages || 1;

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: createAttachment,
    onSuccess: () => {
      toast.success('File uploaded successfully.');
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      setSelectedFile(null);
      setUploadNotes('');
      setView('list');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload attachment.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      toast.success('Attachment deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete attachment.');
    },
  });

  // Action handlers
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileType', uploadFileType);
    if (uploadNotes) {
      formData.append('notes', uploadNotes);
    }
    if (isAdmin && uploadDoctorId) {
      formData.append('doctorId', uploadDoctorId);
    }

    uploadMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this attachment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = async (att: Attachment) => {
    try {
      await downloadAttachment(att.id, att.fileName);
      toast.success('Download started.');
    } catch {
      toast.error('Failed to download file.');
    }
  };

  // Local filter
  const filteredAttachments = attachments.filter((att) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      att.fileName.toLowerCase().includes(query) ||
      (att.notes?.toLowerCase() || '').includes(query) ||
      (att.doctor?.name || att.doctor?.user?.name || '').toLowerCase().includes(query)
    );
  });

  // Icon type helpers
  const getFileTypeIcon = (type: 'X_Ray' | 'Prescription' | 'Images') => {
    switch (type) {
      case 'X_Ray':
        return <Activity className="text-purple-600" size={16} />;
      case 'Prescription':
        return <FileText className="text-blue-600" size={16} />;
      case 'Images':
        return <ImageIcon className="text-emerald-600" size={16} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ------------------ VIEW: GALLERY LIST ------------------ */}
      {view === 'list' && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Header Controls Toolbar */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Diagnostic Library</h2>
              <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
              <div className="flex gap-1.5 flex-wrap">
                {isAdmin && (
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                  >
                    <option value="">-- All Doctors --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name || doc.user?.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="">-- All File Types --</option>
                  <option value="X_Ray">Radiographs (X-Ray)</option>
                  <option value="Prescription">Prescriptions (PDF)</option>
                  <option value="Images">Images (Photos)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-xs w-full lg:w-48"
                />
              </div>
              {canModify && (
                <button
                  onClick={() => setView('upload')}
                  className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Upload Diagnostic
                </button>
              )}
            </div>
          </div>

          {/* Grid Gallery cards */}
          {isLoadingAttachments ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-2 text-muted-foreground py-12">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading diagnostic files...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              {filteredAttachments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-12 text-muted-foreground font-semibold text-sm">
                  No diagnostic attachments found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant hover:border-primary rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all duration-200"
                    >
                      {/* Image / Icon container */}
                      <div className="h-40 bg-surface-container-low relative overflow-hidden border-b border-outline-variant flex items-center justify-center">
                        {att.fileType === 'X_Ray' || att.fileType === 'Images' ? (
                          <SecureImage
                            attachmentId={att.id}
                            alt={att.fileName}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground text-center p-4">
                            <FileText size={36} className="text-blue-500" />
                            <span className="text-[10px] font-mono font-bold uppercase truncate max-w-[130px]">
                              {att.fileName.split('.').pop()} document
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setZoom(1);
                              setRotation(0);
                              setInvert(false);
                              setPreviewAttachment(att);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                            title="Preview file"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(att)}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                            title="Download file"
                          >
                            <Download size={16} />
                          </button>
                          {canModify && (
                            <button
                              onClick={() => handleDelete(att.id)}
                              className="p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg transition-colors"
                              title="Delete file"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card details */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center gap-1">
                            <h4
                              className="text-xs font-bold text-foreground truncate flex-1"
                              title={att.fileName}
                            >
                              {att.fileName}
                            </h4>
                            <span className="shrink-0 flex items-center gap-0.5">
                              {getFileTypeIcon(att.fileType)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {att.notes || 'No description notes.'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-outline-variant flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>By: {att.doctor?.name || att.doctor?.user?.name || 'Assigned'}</span>
                          <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination controls */}
              <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low rounded-xl mt-6">
                <span className="text-xs text-muted-foreground">
                  Showing {filteredAttachments.length} of {totalAttachments} diagnostics
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
          )}
        </div>
      )}

      {/* ------------------ VIEW: UPLOAD FORM ------------------ */}
      {view === 'upload' && (
        <div className="space-y-6">
          <div className="border-b border-outline-variant pb-4">
            <button
              onClick={() => setView('list')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mb-1"
            >
              <ChevronLeft size={12} /> Discard & Return
            </button>
            <h2 className="text-xl font-bold text-foreground">Upload Clinical Diagnostic File</h2>
          </div>

          <form
            onSubmit={handleUploadSubmit}
            className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-6 shadow-sm max-w-xl space-y-5"
          >
            {/* Drag & Drop File Selector */}
            <div className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-8 text-center bg-surface-container-low transition-colors relative cursor-pointer">
              <input
                type="file"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="mx-auto text-muted-foreground mb-3" size={32} />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-foreground">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Drag and drop file here, or click to browse
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Supports JPG, PNG, PDF formats (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Diagnostic Category <span className="text-error">*</span>
                </label>
                <select
                  value={uploadFileType}
                  onChange={(e) => setUploadFileType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="X_Ray">Radiograph (X-Ray)</option>
                  <option value="Prescription">Prescription / Report (PDF)</option>
                  <option value="Images">Patient Photo (Image)</option>
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Attending Doctor <span className="text-error">*</span>
                  </label>
                  <select
                    value={uploadDoctorId}
                    required
                    onChange={(e) => setUploadDoctorId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Assign Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Clinical Notes / Findings Description
              </label>
              <textarea
                rows={4}
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Describe clinical findings, diagnostic indications, or general observations..."
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
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
                disabled={uploadMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                {uploadMutation.isPending ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <UploadCloud size={14} />}
                Upload File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------ DIAGNOSTIC LIGHTBOX VIEWER MODAL ------------------ */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col select-none animate-fade-in">
          {/* Lightbox Toolbar */}
          <div className="h-14 bg-black/40 border-b border-white/10 flex justify-between items-center px-6">
            <div className="flex items-center gap-3">
              <span className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-[400px]">
                {previewAttachment.fileName}
              </span>
              <span className="text-[10px] bg-white/10 text-white/80 rounded px-2 py-0.5 uppercase tracking-wide">
                {previewAttachment.fileType.replace('_', ' ')}
              </span>
            </div>

            {/* Diagnostic controls (only for images/X-rays) */}
            {(previewAttachment.fileType === 'X_Ray' || previewAttachment.fileType === 'Images') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                  className="p-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
                  className="p-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={() => setInvert(!invert)}
                  className={`p-2 rounded transition-colors ${
                    invert ? 'bg-primary text-white' : 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                  title="Invert Colors (Diagnostic mode)"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload(previewAttachment)}
                className="p-2 text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-2 text-white/80 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div className="flex-1 flex flex-col md:flex-row relative">
            {/* Viewer Display */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
              {previewAttachment.fileType === 'X_Ray' || previewAttachment.fileType === 'Images' ? (
                <div
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    filter: invert ? 'invert(1)' : 'none',
                    transition: 'transform 0.2s ease-out, filter 0.1s ease',
                  }}
                  className="max-w-full max-h-[80vh] flex items-center justify-center"
                >
                  <SecureImage
                    attachmentId={previewAttachment.id}
                    alt={previewAttachment.fileName}
                    className="max-w-full max-h-[85vh] rounded shadow-lg object-contain"
                  />
                </div>
              ) : (
                <div className="w-full max-w-4xl h-[80vh] bg-white rounded-lg overflow-hidden flex flex-col shadow-2xl">
                  {/* Since standard iframe won't send the token automatically, we display warning or mock instructions */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-low text-muted-foreground gap-4">
                    <FileText size={48} className="text-blue-500" />
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">Prescription PDF Document</h4>
                      <p className="text-xs">Securely download this file to view prescription and clinical reports.</p>
                    </div>
                    <button
                      onClick={() => handleDownload(previewAttachment)}
                      className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:brightness-95 flex items-center gap-2"
                    >
                      <Download size={16} /> Download Prescription File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lightbox Sidebar Info Panel */}
            <div className="w-full md:w-80 bg-black/50 border-t md:border-t-0 md:border-l border-white/10 p-5 text-white/90 space-y-4">
              <h4 className="text-sm font-bold border-b border-white/10 pb-2">Clinical Details</h4>
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-white/50 uppercase tracking-wide">File Name</span>
                <p className="font-semibold break-all">{previewAttachment.fileName}</p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-white/50 uppercase tracking-wide">Attending Doctor</span>
                <p className="font-semibold">{previewAttachment.doctor?.name || previewAttachment.doctor?.user?.name || 'Attending Doctor'}</p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-white/50 uppercase tracking-wide">Upload Date</span>
                <p className="font-semibold">
                  {new Date(previewAttachment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-white/50 uppercase tracking-wide">Findings Notes</span>
                <p className="text-white/70 bg-white/5 p-3 rounded-lg border border-white/10 leading-relaxed italic">
                  {previewAttachment.notes || 'No description notes.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
