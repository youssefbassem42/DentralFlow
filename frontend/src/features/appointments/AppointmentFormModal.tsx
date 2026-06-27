import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { getDoctors, getPatients, createAppointment, updateAppointment } from './api';
import type { Appointment } from './types';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const formSchema = z.object({
  patientId: z.string().uuid('Please select a patient'),
  doctorId: z.string().uuid('Please select a doctor'),
  appointmentDate: z.string().min(1, 'Please select a date'),
  appointmentTime: z.string().regex(timeRegex, 'Time must be in HH:MM format (24-hour clock)'),
  reason: z.string().min(1, 'Please enter a reason').max(200, 'Reason must be under 200 characters'),
  notes: z.string().optional().nullable(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'Missed']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null; // If passed, we are in Edit/Reschedule mode
  initialDate?: string;
  initialTime?: string;
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  appointment,
  initialDate,
  initialTime,
}: AppointmentFormModalProps) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');

  // Fetch doctors
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    enabled: isOpen,
  });

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients({ search: patientSearch, limit: 100 }),
    enabled: isOpen,
  });

  const doctors = doctorsData?.data || [];
  const patients = patientsData?.data?.patients || [];

  const isEdit = !!appointment;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      notes: '',
      status: 'Scheduled',
    },
  });

  // Prepopulate form if in edit mode or initialDate/Time provided
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Date parsing
        const dateStr = appointment.appointmentDate
          ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
          : '';
        reset({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentDate: dateStr,
          appointmentTime: appointment.appointmentTime,
          reason: appointment.reason || '',
          notes: appointment.notes || '',
          status: appointment.status,
        });
      } else {
        reset({
          patientId: '',
          doctorId: '',
          appointmentDate: initialDate || new Date().toISOString().split('T')[0],
          appointmentTime: initialTime || '09:00',
          reason: '',
          notes: '',
          status: 'Scheduled',
        });
      }
    }
  }, [isOpen, appointment, initialDate, initialTime, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: (response) => {
      toast.success(response.message || 'Appointment booked successfully.');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      const errMsg = error.message || 'Failed to book appointment.';
      toast.error(errMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateAppointment(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Appointment updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      const errMsg = error.message || 'Failed to update appointment.';
      toast.error(errMsg);
    },
  });

  const onSubmit = (values: FormValues) => {
    const formattedData = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      appointmentDate: new Date(values.appointmentDate).toISOString(),
      appointmentTime: values.appointmentTime,
      reason: values.reason,
      notes: values.notes ?? null,
    };

    if (isEdit && appointment) {
      updateMutation.mutate({ id: appointment.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="text-primary w-5 h-5" />
            {isEdit ? 'Edit Appointment' : 'Book Appointment'}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Patient
            </label>
            {isEdit ? (
              <div className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground font-semibold border border-outline-variant">
                {appointment.patient?.fullName} ({appointment.patient?.phone})
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Type to search patients..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
                <select
                  {...register('patientId')}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.patientId.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Doctor / Dentist
            </label>
            <select
              {...register('doctorId')}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.specialization ? `(${d.specialization})` : ''}
                </option>
              ))}
            </select>
            {errors.doctorId && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.doctorId.message}
              </p>
            )}
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('appointmentDate')}
                  className="w-full pl-3 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>
              {errors.appointmentDate && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.appointmentDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Time (24h)
              </label>
              <div className="relative">
                <select
                  {...register('appointmentTime')}
                  className="w-full pl-3 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="20:00">08:00 PM</option>
                </select>
              </div>
              {errors.appointmentTime && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.appointmentTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Status (Only in Edit mode) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground focus:outline-none focus:border-primary text-sm"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Missed">Missed</option>
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Reason / Procedure
            </label>
            <input
              type="text"
              placeholder="e.g. Routine cleaning, Root canal extraction"
              {...register('reason')}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
            />
            {errors.reason && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.reason.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add details, instructions or patient requests..."
              {...register('notes')}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-foreground hover:bg-surface-container-low font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:brightness-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="animate-spin w-4 h-4" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Book Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
