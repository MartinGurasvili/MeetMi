import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Building2, CalendarDays, ShieldCheck } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminPage from './pages/AdminPage';

function Shell() {
  return <div className="min-h-screen text-slate-100"><nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link to="/" className="flex items-center gap-3 text-lg font-semibold"><span className="rounded-2xl bg-cyan-400/15 p-2 text-cyan-300 shadow-glow"><Building2 size={22} /></span>MeetMi</Link><div className="flex gap-3 text-sm text-slate-300"><Link to="/" className="rounded-full px-4 py-2 hover:bg-white/10">Dashboard</Link><Link to="/bookings" className="rounded-full px-4 py-2 hover:bg-white/10"><CalendarDays className="mr-1 inline" size={16} />Bookings</Link><Link to="/admin" className="rounded-full px-4 py-2 hover:bg-white/10"><ShieldCheck className="mr-1 inline" size={16} />Admin</Link><Link to="/login" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">Login</Link></div></nav><Routes><Route path="/" element={<DashboardPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/bookings" element={<MyBookingsPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></div>;
}
export default function App() { return <BrowserRouter><Shell /></BrowserRouter>; }
