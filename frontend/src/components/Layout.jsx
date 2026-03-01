import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Sidebar';
import { ToastContainer } from './Toast';

export default function Layout() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard');

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <Navbar />
      {isDashboard ? (
        /* Dashboard: fills the remaining height exactly, no scroll */
        <main className="flex-1 min-h-0 pt-14 overflow-hidden">
          <Outlet />
        </main>
      ) : (
        /* Other pages: normal scrollable layout */
        <main className="flex-1 pt-24 overflow-y-auto">
          <div className="px-6 pb-12 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      )}
      <ToastContainer />
    </div>
  );
}
