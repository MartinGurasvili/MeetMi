import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';
import FloorPlanEditorPage from './pages/FloorPlanEditorPage';

function Shell() {
  const { pathname } = useLocation();
  const hideNavbar =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/bookings' ||
    pathname.startsWith('/admin') ||
    pathname === '/dev/floor-editor';

  useEffect(() => {
    document.body.classList.remove('dashboard-route', 'app-route');
    if (pathname === '/') {
      document.body.classList.add('dashboard-route');
    } else if (pathname !== '/login' && pathname !== '/dev/floor-editor') {
      document.body.classList.add('app-route');
    }
    return () => document.body.classList.remove('dashboard-route', 'app-route');
  }, [pathname]);

  return (
    <div className="app-frame antialiased">
      {!hideNavbar ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/layout" element={<AdminPage initialTab="layout" />} />
        {import.meta.env.DEV ? <Route path="/dev/floor-editor" element={<FloorPlanEditorPage />} /> : null}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
