import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  Archive, 
  Settings, 
  HelpCircle, 
  Info,
  ClipboardList,
  TrendingUp,
  Activity,
  CreditCard,
  Paperclip,
  BarChart3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/features/authentication/context';
import { Logo } from '../Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Appointments', path: '/appointments', icon: Calendar },
  { name: 'Examinations', path: '/examinations', icon: ClipboardList },
  { name: 'Treatment Plans', path: '/treatment-plans', icon: TrendingUp },
  { name: 'Treatments', path: '/treatments', icon: Activity },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Attachments', path: '/attachments', icon: Paperclip },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Doctors', path: '/doctors', icon: Stethoscope },
  { name: 'Warehouse', path: '/warehouse', icon: Archive },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (item.path === '/examinations' && user?.role === 'RECEPTIONIST') {
      return false;
    }
    if (item.path === '/reports' && user?.role !== 'ADMIN') {
      return false;
    }
    return true;
  });

  return (
    <aside className="bg-surface dark:bg-inverse-surface w-64 fixed left-0 top-0 border-r border-outline-variant dark:border-outline flex flex-col h-screen py-6 px-4 z-50">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Logo className="w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-inverse-primary leading-7">DentalFlow</h1>
          <p className="text-[11px] font-semibold text-muted-foreground leading-[14px]">Clinic Management</p>
        </div>
      </div>
      
      <button className="bg-primary text-primary-foreground w-full py-2 rounded-lg font-semibold text-base mb-6 hover:brightness-95 transition-all duration-200 shadow-sm">
        Quick Action
      </button>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm',
                isActive
                  ? 'text-primary bg-primary/10 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )
            }
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 space-y-2 border-t border-outline-variant dark:border-outline">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 font-medium text-sm">
          <HelpCircle size={20} />
          Support
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 font-medium text-sm">
          <Info size={20} />
          Help
        </button>
      </div>
    </aside>
  );
}
