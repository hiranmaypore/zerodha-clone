import { Outlet } from 'react-router-dom';
import Navbar from './Sidebar';
import { ToastContainer } from './Toast';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="p-4 max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
