import { DollarSign, Users, Calendar, AlertTriangle, ChevronRight, UserPlus, CalendarCheck, Receipt, CheckCircle, PackageOpen, CalendarClock, MoreVertical } from 'lucide-react';
import { useAuth } from '@/features/authentication/context';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-[28px] leading-[36px] font-semibold text-foreground tracking-tight">
            Good morning, {user?.firstName ? `Dr. ${user.firstName}` : 'Doctor'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{new Date().toDateString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
            <div className="bg-primary/10 p-1 rounded-md text-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-semibold text-foreground">$24,500</h3>
            <span className="text-[11px] font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">+12%</span>
          </div>
        </div>

        {/* Today's Patients */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Patients</p>
            <div className="bg-primary/10 p-1 rounded-md text-primary">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-semibold text-foreground">18</h3>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming</p>
            <div className="bg-primary/10 p-1 rounded-md text-primary">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-semibold text-foreground">42</h3>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-error/5 rounded-xl p-4 border border-error/20 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-error uppercase tracking-wider">Low Stock</p>
            <div className="bg-error text-error-foreground p-1 rounded-md">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-semibold text-error">3 Items</h3>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Today's Appointments */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Today's Appointments</h3>
            <button className="text-primary text-xs font-medium hover:underline">View All</button>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider p-2 pl-4">Patient</th>
                  <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider p-2">Time</th>
                  <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider p-2">Procedure</th>
                  <th className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider p-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors duration-200">
                  <td className="p-2 pl-4 font-medium text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">SA</div>
                    Sarah Adams
                  </td>
                  <td className="p-2 text-muted-foreground">09:00 AM</td>
                  <td className="p-2 text-muted-foreground">Routine Checkup</td>
                  <td className="p-2 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary/10 text-tertiary">Completed</span>
                  </td>
                </tr>
                <tr className="hover:bg-primary/5 transition-colors duration-200 bg-primary/5">
                  <td className="p-2 pl-4 font-medium text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">MR</div>
                    Michael Ross
                  </td>
                  <td className="p-2 text-muted-foreground">10:30 AM</td>
                  <td className="p-2 text-muted-foreground">Root Canal</td>
                  <td className="p-2 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">In Progress</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors duration-200">
                  <td className="p-2 pl-4 font-medium text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs">EL</div>
                    Emma Lawson
                  </td>
                  <td className="p-2 text-muted-foreground">01:00 PM</td>
                  <td className="p-2 text-muted-foreground">Whitening</td>
                  <td className="p-2 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">Waiting</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors duration-200">
                  <td className="p-2 pl-4 font-medium text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs">JD</div>
                    John Doe
                  </td>
                  <td className="p-2 text-muted-foreground">02:30 PM</td>
                  <td className="p-2 text-muted-foreground">Consultation</td>
                  <td className="p-2 pr-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">Upcoming</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Revenue Overview */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-foreground">Revenue Overview</h3>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical size={16} />
              </button>
            </div>
            
            {/* Mock Line Chart Area */}
            <div className="h-48 w-full bg-surface-container-low rounded-lg relative overflow-hidden flex items-end px-2 pb-2 gap-2 mt-auto">
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-[40%] hover:bg-primary transition-colors"></div>
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-[60%] hover:bg-primary transition-colors"></div>
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-[45%] hover:bg-primary transition-colors"></div>
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-[70%] hover:bg-primary transition-colors"></div>
              <div className="w-1/6 bg-primary/40 rounded-t-sm h-[85%] hover:bg-primary transition-colors"></div>
              <div className="w-1/6 bg-primary rounded-t-sm h-[100%] shadow-[0_0_10px_rgba(0,100,146,0.5)]"></div>
              
              {/* Overlay line approximation */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="text-primary drop-shadow-md" d="M 5,80 L 22,60 L 38,70 L 55,45 L 72,30 L 90,15" fill="none" stroke="currentColor" strokeWidth="2"></path>
                <circle className="text-primary" cx="90" cy="15" fill="currentColor" r="3"></circle>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 text-foreground text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                  <UserPlus size={18} />
                </div>
                New Patient
              </div>
              <ChevronRight className="text-muted-foreground" size={16} />
            </button>
            <button className="w-full flex items-center justify-between p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 text-foreground text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                  <CalendarCheck size={18} />
                </div>
                Book Appointment
              </div>
              <ChevronRight className="text-muted-foreground" size={16} />
            </button>
            <button className="w-full flex items-center justify-between p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors duration-200 text-foreground text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                  <Receipt size={18} />
                </div>
                Create Invoice
              </div>
              <ChevronRight className="text-muted-foreground" size={16} />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            
            <div className="flex gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-tertiary/20 flex items-center justify-center z-10 relative">
                  <CheckCircle className="text-tertiary" size={16} />
                </div>
                <div className="absolute top-8 bottom-[-16px] left-1/2 w-px bg-outline-variant -translate-x-1/2"></div>
              </div>
              <div>
                <p className="text-sm text-foreground">Invoice <span className="font-semibold">#INV-2024-089</span> paid by Sarah Adams</p>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1">10 minutes ago</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-error/20 flex items-center justify-center z-10 relative">
                  <PackageOpen className="text-error" size={16} />
                </div>
                <div className="absolute top-8 bottom-[-16px] left-1/2 w-px bg-outline-variant -translate-x-1/2"></div>
              </div>
              <div>
                <p className="text-sm text-foreground">Low stock alert: <span className="font-semibold">Lidocaine Cartridges</span></p>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1">45 minutes ago</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center z-10 relative">
                  <CalendarClock className="text-primary" size={16} />
                </div>
              </div>
              <div>
                <p className="text-sm text-foreground">Appointment rescheduled for <span className="font-semibold">David Lee</span></p>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
