import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, CalendarClock, CircleAlert, Clock3, MapPin, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout';
import { demoFloors } from '../data/demo';
import { formatBookingDateTime, formatBookingTimeRange } from '../lib/dates';
import type { Booking } from '../types';

type BookingsTab = 'upcoming' | 'past';

function officeNameForBooking(booking: Booking) {
  const floorId = booking.space?.floor_id;
  return demoFloors.find((floor) => floor.id === floorId)?.name ?? 'Office location';
}

function splitBookings(bookings: Booking[]) {
  const now = Date.now();
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const upcoming = confirmed
    .filter((booking) => new Date(booking.end_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = confirmed
    .filter((booking) => new Date(booking.end_time).getTime() < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  return { upcoming, past };
}

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<BookingsTab>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function loadBookings() {
    setError(false);
    try {
      setBookings(await api.myBookings());
    } catch {
      setBookings([]);
      setError(true);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    void loadBookings();
  }, [authLoading, user]);

  const { upcoming, past } = useMemo(() => splitBookings(bookings), [bookings]);
  const visible = tab === 'upcoming' ? upcoming : past;

  async function cancelBooking(id: number) {
    setCancellingId(id);
    try {
      await api.cancelBooking(id);
      await loadBookings();
    } catch {
      setError(true);
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading) {
    return (
      <PageLayout>
        <div className="bookings-panel bookings-panel-center">
          <CalendarClock className="bookings-empty-icon" size={30} aria-hidden />
          <p className="bookings-empty-title">Checking your session</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="bookings-panel bookings-panel-center">
          <CircleAlert className="bookings-empty-icon is-warning" size={30} aria-hidden />
          <p className="bookings-empty-title">Please log in</p>
          <p className="bookings-empty-copy">Sign in to view and manage your workspace bookings.</p>
          <NavLink to="/login" className="btn-primary mt-5">
            Log in
          </NavLink>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <header className="bookings-panel bookings-hero">
        <p className="app-kicker">Schedule</p>
        <div className="bookings-hero-row">
          <div>
            <h1 className="app-title">My bookings</h1>
            <p className="app-subtle">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
          <div className="bookings-stat-pill">
            <CalendarClock size={17} aria-hidden />
            <span>{bookings.filter((b) => b.status === 'confirmed').length} confirmed</span>
          </div>
        </div>

        <div className="bookings-tabs" role="tablist" aria-label="Booking periods">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upcoming'}
            className={tab === 'upcoming' ? 'bookings-tab is-active' : 'bookings-tab'}
            onClick={() => setTab('upcoming')}
          >
            Upcoming
            <span>{upcoming.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'past'}
            className={tab === 'past' ? 'bookings-tab is-active' : 'bookings-tab'}
            onClick={() => setTab('past')}
          >
            Past
            <span>{past.length}</span>
          </button>
        </div>
      </header>

      <div className="bookings-list">
        {error ? (
          <div className="bookings-panel bookings-panel-center">
            <CircleAlert className="bookings-empty-icon is-danger" size={28} aria-hidden />
            <p className="bookings-empty-title is-danger">Could not load bookings</p>
            <p className="bookings-empty-copy">Check your session and backend connection.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bookings-panel bookings-panel-center">
            <CalendarClock className="bookings-empty-icon" size={30} aria-hidden />
            <p className="bookings-empty-title">{tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}</p>
            <p className="bookings-empty-copy">
              {tab === 'upcoming' ? 'Your confirmed reservations will appear here.' : 'Completed bookings will show up here.'}
            </p>
          </div>
        ) : (
          visible.map((booking, index) => (
            <article
              key={booking.id}
              className="bookings-card"
              style={{ animation: `fadeUp 260ms ease-out ${index * 50}ms both` }}
            >
              <div className="bookings-card-main">
                <div className="bookings-card-head">
                  <h2>{booking.space?.name ?? booking.title}</h2>
                  <span className="bookings-status-pill">{booking.status}</span>
                </div>
                <p className="bookings-card-subtitle">{booking.title}</p>
                <div className="bookings-meta-grid">
                  <div className="bookings-meta-item">
                    <CalendarClock size={16} aria-hidden />
                    <span>{formatBookingDateTime(booking.start_time)}</span>
                  </div>
                  <div className="bookings-meta-item">
                    <Clock3 size={16} aria-hidden />
                    <span>{formatBookingTimeRange(booking.start_time, booking.end_time)}</span>
                  </div>
                  <div className="bookings-meta-item">
                    <Building2 size={16} aria-hidden />
                    <span>{officeNameForBooking(booking)}</span>
                  </div>
                  <div className="bookings-meta-item">
                    <MapPin size={16} aria-hidden />
                    <span>{booking.space?.zone ?? 'Workspace zone'}</span>
                  </div>
                </div>
              </div>
              {tab === 'upcoming' ? (
                <button
                  type="button"
                  className="bookings-cancel-button"
                  onClick={() => void cancelBooking(booking.id)}
                  disabled={cancellingId === booking.id}
                >
                  <Trash2 size={16} aria-hidden />
                  {cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </PageLayout>
  );
}
