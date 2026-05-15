import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';
import FloorPlanEditorPage from './pages/FloorPlanEditorPage';

function Shell() {
  const { pathname } = useLocation();
  const showNavbar = pathname !== '/' && pathname !== '/login' && pathname !== '/dev/floor-editor';

  return (
    <div className="app-frame antialiased">
      {showNavbar ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
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
