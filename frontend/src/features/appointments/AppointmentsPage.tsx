import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/features/authentication/context';
import { getAppointments, getDoctors } from './api';
import { AppointmentFormModal } from './AppointmentFormModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import type { Appointment } from './types';

// Work day start and end hours (8 AM to 8 PM)
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);

export function AppointmentsPage() {
  const { user } = useAuth();

  // View settings
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarSubMode, setCalendarSubMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Sidebar mini-calendar month navigation
  const [miniCalMonth, setMiniCalMonth] = useState(dayjs());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'Scheduled',
    'Completed',
    'Cancelled',
    'Missed',
  ]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  
  // Initial date/time when clicking empty calendar cells
  const [initFormDate, setInitFormDate] = useState<string>('');
  const [initFormTime, setInitFormTime] = useState<string>('');

  // Fetch doctors (for sidebar filters)
  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });
  const doctors = doctorsRes?.data || [];

  // Fetch appointments (fetch all with large limit for the calendar view)
  const { data: appointmentsRes, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => getAppointments({ limit: 1000 }),
  });
  const rawAppointments = appointmentsRes?.data?.appointments || [];

  // Determine permissions
  const canBook = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // Format active week/day display
  const startOfWeek = dayjs(selectedDate).startOf('week').add(1, 'day'); // Monday
  const endOfWeek = startOfWeek.add(6, 'day');

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [selectedDate]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return rawAppointments.filter((appt) => {
      // Filter by doctor
      if (selectedDoctors.length > 0 && !selectedDoctors.includes(appt.doctorId)) {
        return false;
      }
      // Filter by status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(appt.status)) {
        return false;
      }
      // Filter by search query (patient name, doctor name, reason)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const patientName = appt.patient?.fullName?.toLowerCase() || '';
        const doctorName = appt.doctor?.name?.toLowerCase() || '';
        const reason = appt.reason?.toLowerCase() || '';
        if (
          !patientName.includes(query) &&
          !doctorName.includes(query) &&
          !reason.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawAppointments, selectedDoctors, selectedStatuses, searchQuery]);

  // Separate week appointments for Calendar
  const weekAppointments = useMemo(() => {
    return filteredAppointments.filter((appt) => {
      const apptDate = dayjs(appt.appointmentDate);
      if (calendarSubMode === 'week') {
        return apptDate.isAfter(startOfWeek.subtract(1, 'day')) && apptDate.isBefore(endOfWeek.add(1, 'day'));
      } else {
        return apptDate.isSame(dayjs(selectedDate), 'day');
      }
    });
  }, [filteredAppointments, calendarSubMode, selectedDate, startOfWeek, endOfWeek]);

  // Handler for today button
  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setMiniCalMonth(dayjs(today));
  };

  // Handler for previous week/day
  const handlePrev = () => {
    if (calendarSubMode === 'week') {
      setSelectedDate(dayjs(selectedDate).subtract(1, 'week').toDate());
    } else {
      setSelectedDate(dayjs(selectedDate).subtract(1, 'day').toDate());
    }
  };

  // Handler for next week/day
  const handleNext = () => {
    if (calendarSubMode === 'week') {
      setSelectedDate(dayjs(selectedDate).add(1, 'week').toDate());
    } else {
      setSelectedDate(dayjs(selectedDate).add(1, 'day').toDate());
    }
  };

  // Click on empty cell to book
  const handleCellClick = (date: dayjs.Dayjs, hour: number) => {
    if (!canBook) return;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setInitFormDate(date.format('YYYY-MM-DD'));
    setInitFormTime(timeStr);
    setSelectedAppt(null);
    setIsFormOpen(true);
  };

  // Status style helper
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'border-tertiary bg-tertiary/10 text-tertiary-container dark:text-tertiary';
      case 'Cancelled':
        return 'border-error bg-error/10 text-error';
      case 'Missed':
        return 'border-orange-500 bg-orange-100 text-orange-800';
      default:
        return 'border-primary bg-primary-container/20 text-primary';
    }
  };

  // Generate mini calendar dates array
  const miniCalendarDays = useMemo(() => {
    const startOfMonth = miniCalMonth.startOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = miniCalMonth.daysInMonth();
    
    const days = [];
    
    // Fill previous month days
    const prevMonth = miniCalMonth.subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.date(prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    
    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: miniCalMonth.date(i),
        isCurrentMonth: true,
      });
    }
    
    return days;
  }, [miniCalMonth]);

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-8rem)]">
      {/* Top Toolbar */}
      <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant rounded-xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">Appointments</h2>
          <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-foreground hover:bg-surface-container-high font-medium shadow-sm transition-colors"
            >
              Today
            </button>
            <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-low shadow-sm overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-1.5 text-muted-foreground hover:bg-surface-container-high transition-colors border-r border-outline-variant"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-1.5 text-xs text-foreground font-semibold flex items-center gap-2">
                <CalendarIcon size={14} className="text-muted-foreground" />
                {calendarSubMode === 'week' ? (
                  <>
                    {startOfWeek.format('MMM DD')} - {endOfWeek.format('MMM DD, YYYY')}
                  </>
                ) : (
                  dayjs(selectedDate).format('MMMM DD, YYYY')
                )}
              </div>
              <button
                onClick={handleNext}
                className="p-1.5 text-muted-foreground hover:bg-surface-container-high transition-colors border-l border-outline-variant"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            <button
              onClick={() => {
                setViewMode('calendar');
                setCalendarSubMode('day');
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'calendar' && calendarSubMode === 'day'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
                setCalendarSubMode('week');
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'calendar' && calendarSubMode === 'week'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List View
            </button>
          </div>

          {canBook && (
            <button
              onClick={() => {
                setSelectedAppt(null);
                setInitFormDate('');
                setInitFormTime('');
                setIsFormOpen(true);
              }}
              className="bg-primary text-primary-foreground py-1.5 px-4 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={14} /> Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest dark:bg-inverse-surface shadow-sm">
        {/* Sidebar Filters */}
        <aside className="w-64 border-r border-outline-variant bg-surface-container-low/50 dark:bg-inverse-surface p-4 shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {/* Mini Calendar Widget */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-foreground">
                {miniCalMonth.format('MMMM YYYY')}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setMiniCalMonth(miniCalMonth.subtract(1, 'month'))}
                  className="text-muted-foreground hover:text-foreground hover:bg-surface-container-high rounded p-1"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setMiniCalMonth(miniCalMonth.add(1, 'month'))}
                  className="text-muted-foreground hover:text-foreground hover:bg-surface-container-high rounded p-1"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase mb-2">
              <div>S</div>
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-foreground">
              {miniCalendarDays.map((day, idx) => {
                const isSelected = dayjs(selectedDate).isSame(day.date, 'day');
                const isToday = dayjs().isSame(day.date, 'day');
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day.date.toDate())}
                    className={`p-1.5 rounded-lg cursor-pointer transition-all hover:bg-primary/10 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold'
                        : isToday
                        ? 'border border-primary text-primary font-bold'
                        : day.isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground/40'
                    }`}
                  >
                    {day.date.date()}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Search box */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Search
            </h4>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search appts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Filter by Doctor */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Filter by Doctor
            </h4>
            <div className="flex flex-col gap-2">
              {doctors.map((doc) => {
                const isChecked = selectedDoctors.includes(doc.id);
                return (
                  <label key={doc.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedDoctors(selectedDoctors.filter((id) => id !== doc.id));
                        } else {
                          setSelectedDoctors([...selectedDoctors, doc.id]);
                        }
                      }}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {doc.name}
                    </span>
                  </label>
                );
              })}
              {doctors.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No doctors loaded.</p>
              )}
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Filter by Status */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Status
            </h4>
            <div className="flex flex-col gap-2">
              {['Scheduled', 'Completed', 'Cancelled', 'Missed'].map((status) => {
                const isChecked = selectedStatuses.includes(status);
                return (
                  <label key={status} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                        } else {
                          setSelectedStatuses([...selectedStatuses, status]);
                        }
                      }}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs text-foreground">{status}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Central Layout content */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-surface dark:bg-inverse-surface">
          {isLoadingAppointments ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 text-muted-foreground">
              <Clock className="animate-spin w-8 h-8 text-primary" />
              <p className="text-sm font-semibold">Loading appointments...</p>
            </div>
          ) : viewMode === 'calendar' ? (
            /* Calendar View Mode */
            <div className="min-w-[700px]">
              {/* Header Days Row */}
              <div className="calendar-grid sticky top-0 bg-surface dark:bg-inverse-surface z-25 border-b border-outline-variant shadow-sm text-center">
                <div className="time-col border-r border-outline-variant p-3 flex items-end justify-center text-[10px] font-bold text-muted-foreground uppercase">
                  Time
                </div>
                {calendarSubMode === 'week' ? (
                  daysOfWeek.map((day, idx) => {
                    const isToday = dayjs().isSame(day, 'day');
                    return (
                      <div
                        key={idx}
                        className={`p-2 border-r border-outline-variant flex flex-col items-center ${
                          isToday ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className={`text-[10px] uppercase font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {day.format('ddd')}
                        </div>
                        <div
                          className={`text-sm font-bold w-7 h-7 leading-7 rounded-full mt-1 ${
                            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                          }`}
                        >
                          {day.date()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-7 p-2 bg-primary/5 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase font-bold text-primary">
                      {dayjs(selectedDate).format('dddd')}
                    </div>
                    <div className="text-sm font-bold bg-primary text-primary-foreground w-8 h-8 leading-8 rounded-full mt-1">
                      {dayjs(selectedDate).date()}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid Body */}
              <div className="calendar-grid relative z-10 bg-surface dark:bg-inverse-surface">
                {/* Render Hour Blocks */}
                {HOURS.map((hour) => {
                  const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                  const rowClass = `time-row-${hour}`;
                  
                  return (
                    <div key={hour} className="contents">
                      {/* Hour label */}
                      <div
                        className={`time-col ${rowClass} border-r border-b border-outline-variant p-2 text-right text-[10px] font-bold text-muted-foreground pt-3 relative z-10`}
                      >
                        {displayHour}
                      </div>

                      {/* Day cells in week view */}
                      {calendarSubMode === 'week' ? (
                        daysOfWeek.map((day, dayIdx) => {
                          const isToday = dayjs().isSame(day, 'day');
                          return (
                            <div
                              key={dayIdx}
                              onClick={() => handleCellClick(day, hour)}
                              className={`day-col-${
                                dayIdx + 1
                              } ${rowClass} border-r border-b border-outline-variant cursor-pointer hover:bg-primary/5 transition-colors relative min-h-[60px] ${
                                isToday ? 'bg-primary/5' : ''
                              }`}
                            />
                          );
                        })
                      ) : (
                        <div
                          onClick={() => handleCellClick(dayjs(selectedDate), hour)}
                          className={`col-span-7 ${rowClass} border-b border-outline-variant cursor-pointer hover:bg-primary/5 transition-colors relative min-h-[60px] bg-primary/5`}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Render Appointments as overlay grid items */}
                {weekAppointments.map((appt) => {
                  const apptDate = dayjs(appt.appointmentDate);
                  // Calculate column placement
                  let colClass = '';
                  if (calendarSubMode === 'week') {
                    // Monday is index 1 in dayjs, Sunday is 0. Map Sunday to 7, Monday to 1
                    const dayOfWeekVal = apptDate.day();
                    const index = dayOfWeekVal === 0 ? 7 : dayOfWeekVal;
                    colClass = `day-col-${index}`;
                  } else {
                    colClass = 'col-span-7';
                  }

                  // Calculate row placement based on hour
                  const hourStr = appt.appointmentTime.split(':')[0];
                  const hourVal = parseInt(hourStr);
                  const rowClass = `time-row-${hourVal}`;

                  return (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering cell click
                        setSelectedAppt(appt);
                        setIsDetailsOpen(true);
                      }}
                      className={`${colClass} ${rowClass} m-1 p-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer z-20 flex flex-col justify-between overflow-hidden ${getStatusClasses(
                        appt.status
                      )}`}
                    >
                      <div>
                        <div className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                          <Clock size={8} /> {appt.appointmentTime}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {appt.patient?.fullName}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">{appt.reason}</div>
                      </div>
                      <div className="text-[9px] font-semibold tracking-wider text-right opacity-80 mt-1 uppercase">
                        {appt.doctor?.name.replace('Dr. ', '')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View Mode */
            <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-3 pl-4">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-outline-variant text-foreground">
                  {filteredAppointments.map((appt) => (
                    <tr
                      key={appt.id}
                      onClick={() => {
                        setSelectedAppt(appt);
                        setIsDetailsOpen(true);
                      }}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <td className="p-3 pl-4 font-semibold">{appt.patient?.fullName}</td>
                      <td className="p-3">{appt.doctor?.name}</td>
                      <td className="p-3">
                        {new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 font-medium">{appt.appointmentTime}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                        {appt.reason}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            appt.status === 'Completed'
                              ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                              : appt.status === 'Cancelled'
                              ? 'bg-error/10 text-error border-error/20'
                              : appt.status === 'Missed'
                              ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground font-semibold">
                        No appointments found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Booking/Editing Modal */}
      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAppt(null);
        }}
        appointment={selectedAppt}
        initialDate={initFormDate}
        initialTime={initFormTime}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppt(null);
        }}
        appointment={selectedAppt}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
