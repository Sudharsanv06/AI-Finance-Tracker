import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';

import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Events     from './pages/Events';
import Expenses   from './pages/Expenses';
import NotFound   from './pages/NotFound';
import Profile from './pages/Profile';
import Income  from './pages/Income';
import Family  from './pages/Family';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events"    element={<Events />} />
            <Route path="/expenses"  element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/income" element={<Income />} />
            <Route path="/family" element={<Family />} />
          </Route>

          {/* Redirects */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}