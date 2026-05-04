import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarClock, CircleAlert, MapPin, TicketCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout';
import type { Booking } from '../types';

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    setError(false);
    api.myBookings().then(setBookings).catch(() => {
      setBookings([]);
      setError(true);
    });
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <PageLayout>
        <div className="surface-panel rounded-lg px-5 py-10 text-center">
          <CalendarClock className="mx-auto text-[var(--color-primary)]" size={30} aria-hidden />
          <p className="mt-3 text-sm font-black text-[var(--color-text)]">Checking your session</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="surface-panel rounded-lg px-5 py-10 text-center">
          <CircleAlert className="mx-auto text-[var(--color-primary)]" size={30} aria-hidden />
          <p className="mt-3 text-lg font-black text-[var(--color-text)]">Please log in</p>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-[var(--color-muted)]">
            Sign in to view and manage your workspace bookings.
          </p>
          <NavLink to="/login" className="btn-primary mt-5">
            Log in
          </NavLink>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <header className="surface-panel mb-4 rounded-lg p-4 animate-[fadeUp_280ms_ease-out] sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">Schedule</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">My bookings</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">
              {bookings.length} active {bookings.length === 1 ? 'reservation' : 'reservations'}
            </p>
          </div>
          <span className="mini-stat inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-[var(--color-text)]">
            <TicketCheck size={17} className="text-[var(--color-primary)]" aria-hidden />
            Confirmed spaces
          </span>
        </div>
      </header>

      <div className="grid gap-3">
        {error ? (
          <div className="surface-panel rounded-lg px-5 py-10 text-center">
            <CircleAlert className="mx-auto text-[var(--color-danger)]" size={28} aria-hidden />
            <p className="mt-3 text-sm font-black text-[var(--color-danger)]">Could not load bookings</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">Check your session and backend connection.</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="surface-panel rounded-lg px-5 py-10 text-center">
            <CalendarClock className="mx-auto text-[var(--color-primary)]" size={30} aria-hidden />
            <p className="mt-3 text-sm font-black text-[var(--color-text)]">No bookings yet</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">Your upcoming reservations will appear here.</p>
          </div>
        ) : null}

        {bookings.map((booking, index) => (
          <article
            key={booking.id}
            className="surface-panel grid gap-4 rounded-lg p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            style={{ animation: `fadeUp 260ms ease-out ${index * 50}ms both` }}
          >
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-[var(--color-text)]">{booking.title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-1.5 text-[var(--color-text)]">
                  <MapPin size={15} aria-hidden />
                  {booking.space?.name ?? 'Space'}
                </span>
                <time dateTime={booking.start_time}>{new Date(booking.start_time).toLocaleString()}</time>
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--color-primary-strong)]">
              {booking.status}
            </span>
          </article>
        ))}
      </div>
    </PageLayout>
  );
}
