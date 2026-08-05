import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ChatBot from './ChatBot';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  );
}