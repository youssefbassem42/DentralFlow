import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-20 px-6 pb-8 min-h-screen flex flex-col">
        <Outlet />
        
        {/* Footer */}
        <footer className="mt-auto pt-6 text-muted-foreground text-xs font-medium border-t border-outline-variant dark:border-outline flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="uppercase tracking-wider">
            © 2024 DentalFlow SaaS. v2.4.0
          </div>
          <div className="flex gap-4">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Compliance</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
