import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Sidebar';
import { ToastContainer } from './Toast';
import OnboardingTour from './OnboardingTour';
import KeyboardShortcuts from './KeyboardShortcuts';

export default function Layout() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard');

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <Navbar />
      <OnboardingTour />
      <KeyboardShortcuts />
      {isDashboard ? (
        /* Dashboard: exactly fits on desktop, scrolls on mobile */
        <main className="flex-1 min-h-0 pt-14 pb-16 md:pb-0 overflow-y-auto lg:overflow-hidden">
          <Outlet />
        </main>
      ) : (
        /* Other pages: normal scrollable layout */
        <main className="flex-1 pt-24 pb-16 md:pb-0 overflow-y-auto">
          <div className="px-3 md:px-6 pb-12 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      )}
      <ToastContainer />
    </div>
  );
}
