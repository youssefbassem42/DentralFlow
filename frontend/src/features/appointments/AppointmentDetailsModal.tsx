import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import { deleteAppointment, updateAppointment } from './api';
import type { Appointment } from './types';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onEdit: () => void;
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onEdit,
}: AppointmentDetailsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!isOpen || !appointment) return null;

  // Determine permissions
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const isDoctor = user?.role === 'DOCTOR';

  // Actions allowed based on roles
  const canModifyDetails = isAdmin || isReceptionist;
  const canChangeStatus = isAdmin || isReceptionist || isDoctor;
  const canDelete = isAdmin || isReceptionist;

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      case 'Cancelled':
        return 'bg-error/10 text-error border-error/20';
      case 'Missed':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'Completed' | 'Cancelled' | 'Missed') =>
      updateAppointment(appointment.id, { status }),
    onSuccess: (response) => {
      toast.success(response.message || 'Appointment status updated.');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAppointment(appointment.id),
    onSuccess: (response) => {
      toast.success(response.message || 'Appointment deleted.');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete appointment.');
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to cancel and delete this appointment?')) {
      deleteMutation.mutate();
    }
  };

  const formattedDate = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="text-lg font-bold text-foreground">Appointment Details</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status badge & title */}
          <div className="flex justify-between items-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                appointment.status
              )}`}
            >
              {appointment.status}
            </span>
            <span className="text-xs text-muted-foreground">ID: {appointment.id.substring(0, 8)}</span>
          </div>

          {/* Date and Time block */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Calendar className="text-primary w-4 h-4" />
              <span className="font-semibold">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Clock className="text-primary w-4 h-4" />
              <span className="font-semibold">{appointment.appointmentTime}</span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient</h4>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {appointment.patient?.fullName}
                </p>
                <p className="text-xs text-muted-foreground">Phone: {appointment.patient?.phone}</p>
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Doctor</h4>
            <div className="flex items-start gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                <Stethoscope size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{appointment.doctor?.name}</p>
                {appointment.doctor?.specialization && (
                  <p className="text-xs text-muted-foreground">
                    Spec: {appointment.doctor.specialization}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Reason / Procedure
            </h4>
            <p className="text-sm text-foreground bg-surface-container-lowest p-3 rounded-lg border border-outline-variant font-medium">
              {appointment.reason || 'No reason specified'}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</h4>
            <p className="text-sm text-muted-foreground bg-surface-container-lowest p-3 rounded-lg border border-outline-variant italic">
              {appointment.notes || 'No notes added'}
            </p>
          </div>

          {/* Created by */}
          {appointment.creator && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <UserCheck size={12} />
              <span>
                Booked by {appointment.creator.name} ({appointment.creator.role})
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 border border-outline-variant bg-surface hover:bg-error/10 hover:text-error rounded-lg text-muted-foreground transition-colors"
                title="Delete Appointment"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {canChangeStatus && appointment.status === 'Scheduled' && (
              <>
                <button
                  onClick={() => updateStatusMutation.mutate('Completed')}
                  className="px-3 py-2 bg-tertiary text-on-tertiary hover:brightness-95 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 size={14} />
                  Complete
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate('Cancelled')}
                  className="px-3 py-2 bg-error text-on-error hover:brightness-95 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              </>
            )}
            {canModifyDetails && (
              <button
                onClick={onEdit}
                className="px-3 py-2 bg-primary text-primary-foreground hover:brightness-95 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Edit size={14} />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
