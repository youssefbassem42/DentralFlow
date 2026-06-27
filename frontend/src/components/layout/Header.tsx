import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/features/authentication/context';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md fixed top-0 right-0 w-[calc(100%-16rem)] h-16 border-b border-outline-variant dark:border-outline shadow-sm flex items-center justify-between px-6 z-40">
      <div className="flex-1 flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64 focus-within:ring-2 focus-within:ring-primary rounded-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm" 
            placeholder="Search patients..." 
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-primary transition-colors duration-200 p-2 rounded-full hover:bg-muted">
          <Bell size={20} />
        </button>
        <button className="text-muted-foreground hover:text-primary transition-colors duration-200 p-2 rounded-full hover:bg-muted">
          <Settings size={20} />
        </button>
        
        <div className="relative group">
          <button className="h-8 w-8 rounded-full overflow-hidden border-2 border-primary-container ml-2 bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-md shadow-lg py-1 z-50 border border-outline-variant hidden group-hover:block group-focus-within:block">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-outline-variant">
              Signed in as<br/>
              <span className="font-semibold text-foreground truncate block">{user?.email}</span>
            </div>
            <button 
              onClick={() => logout()}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
