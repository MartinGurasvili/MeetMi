import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  CircleAlert,
  Layers3,
  LayoutGrid,
  MapPinned,
  Trash2,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import AppToast, { type AppToastTone } from '../components/AppToast';
import FloorPlanEditorPage from './FloorPlanEditorPage';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import { formatBookingDateTime, formatBookingTimeRange } from '../lib/dates';
import type { AdminBookingRow, OfficeFloor, Space } from '../types';

type AdminTab = 'bookings' | 'layout' | 'offices';
type BookingsTab = 'upcoming' | 'past';

function splitAdminBookings(bookings: AdminBookingRow[]) {
  const now = Date.now();
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const upcoming = confirmed
    .filter((b) => new Date(b.end_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = confirmed
    .filter((b) => new Date(b.end_time).getTime() < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  return { upcoming, past };
}

interface Props {
  initialTab?: AdminTab;
}

export default function AdminPage({ initialTab = 'bookings' }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [bookingsTab, setBookingsTab] = useState<BookingsTab>('upcoming');
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [floors, setFloors] = useState<OfficeFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone }>({ message: '', tone: 'info' });
  const [officeName, setOfficeName] = useState('');
  const [officeFloorNumber, setOfficeFloorNumber] = useState(1);
  const [creatingOffice, setCreatingOffice] = useState(false);

  function showToast(message: string, tone: AppToastTone = 'info') {
    setToast({ message, tone });
  }

  useEffect(() => {
    if (!toast.message) return;
    const timer = window.setTimeout(() => setToast({ message: '', tone: 'info' }), 5000);
    return () => window.clearTimeout(timer);
  }, [toast.message]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [allBookings, allSpaces, allFloors] = await Promise.all([
        api.adminBookings(),
        api.spaces(),
        api.floors(),
      ]);
      setBookings(allBookings);
      setSpaces(allSpaces);
      setFloors(allFloors);
    } catch {
      showToast('Could not load admin data. Check your session.', 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    void loadAdminData();
  }, [authLoading, user]);

  const { upcoming, past } = useMemo(() => splitAdminBookings(bookings), [bookings]);
  const visibleBookings = bookingsTab === 'upcoming' ? upcoming : past;

  const roomCount = spaces.filter((space) => space.type === 'meeting_room').length;
  const deskCount = spaces.filter((space) => space.type === 'hot_desk').length;
  const capacity = spaces.reduce((sum, space) => sum + space.capacity, 0);

  async function cancelBooking(id: number) {
    setCancellingId(id);
    try {
      await api.adminCancelBooking(id);
      showToast('Booking cancelled.', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not cancel booking.', 'error');
    } finally {
      setCancellingId(null);
    }
  }

  async function createOffice(event: React.FormEvent) {
    event.preventDefault();
    if (!officeName.trim()) return;
    setCreatingOffice(true);
    try {
      await api.adminCreateFloor({ name: officeName.trim(), floor_number: officeFloorNumber });
      showToast(`Office "${officeName.trim()}" created.`, 'success');
      setOfficeName('');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create office.', 'error');
    } finally {
      setCreatingOffice(false);
    }
  }

  if (authLoading) {
    return (
      <PageLayout backLabel="Back to map">
        <div className="bookings-panel bookings-panel-center">
          <CalendarClock className="bookings-empty-icon" size={30} aria-hidden />
          <p className="bookings-empty-title">Checking your session</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout backLabel="Back to map">
        <div className="bookings-panel bookings-panel-center">
          <CircleAlert className="bookings-empty-icon is-warning" size={30} aria-hidden />
          <p className="bookings-empty-title">Please log in</p>
          <p className="bookings-empty-copy">Admin access requires an authenticated account.</p>
          <NavLink to="/login" className="btn-primary mt-5">
            Log in
          </NavLink>
        </div>
      </PageLayout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <PageLayout backLabel="Back to map">
        <div className="bookings-panel bookings-panel-center">
          <CircleAlert className="bookings-empty-icon is-danger" size={28} aria-hidden />
          <p className="bookings-empty-title is-danger">Admin only</p>
          <p className="bookings-empty-copy">Your account does not have admin permissions.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout backLabel="Back to map" variant={tab === 'layout' ? 'default' : 'default'}>
      <AppToast message={toast.message} tone={toast.tone} />

      <header className="admin-hero app-panel">
        <p className="app-kicker">Administration</p>
        <div className="admin-hero-row">
          <div>
            <h1 className="app-title">Operations console</h1>
            <p className="app-subtle">
              {upcoming.length} upcoming · {past.length} past · {floors.length} offices
            </p>
          </div>
          <div className="admin-stat-row">
            <div className="app-stat admin-stat">
              <Building2 size={17} className="text-[#7ec8ff]" aria-hidden />
              <strong>{deskCount}</strong>
              <span>Desks</span>
            </div>
            <div className="app-stat admin-stat">
              <Layers3 size={17} className="text-[#30d158]" aria-hidden />
              <strong>{roomCount}</strong>
              <span>Rooms</span>
            </div>
            <div className="app-stat admin-stat">
              <Users size={17} className="text-[#64d2ff]" aria-hidden />
              <strong>{capacity}</strong>
              <span>Seats</span>
            </div>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'bookings'}
            className={tab === 'bookings' ? 'admin-tab is-active' : 'admin-tab'}
            onClick={() => setTab('bookings')}
          >
            <CalendarClock size={16} aria-hidden />
            Bookings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layout'}
            className={tab === 'layout' ? 'admin-tab is-active' : 'admin-tab'}
            onClick={() => setTab('layout')}
          >
            <LayoutGrid size={16} aria-hidden />
            Floor layout
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'offices'}
            className={tab === 'offices' ? 'admin-tab is-active' : 'admin-tab'}
            onClick={() => setTab('offices')}
          >
            <MapPinned size={16} aria-hidden />
            Offices & spaces
          </button>
        </div>
      </header>

      {tab === 'bookings' ? (
        <section className="admin-section">
          <div className="bookings-tabs" role="tablist" aria-label="Booking periods">
            <button
              type="button"
              role="tab"
              aria-selected={bookingsTab === 'upcoming'}
              className={bookingsTab === 'upcoming' ? 'bookings-tab is-active' : 'bookings-tab'}
              onClick={() => setBookingsTab('upcoming')}
            >
              Upcoming
              <span>{upcoming.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bookingsTab === 'past'}
              className={bookingsTab === 'past' ? 'bookings-tab is-active' : 'bookings-tab'}
              onClick={() => setBookingsTab('past')}
            >
              Past
              <span>{past.length}</span>
            </button>
          </div>

          <div className="bookings-list">
            {loading ? (
              <div className="bookings-panel bookings-panel-center">
                <CalendarClock className="bookings-empty-icon" size={28} aria-hidden />
                <p className="bookings-empty-title">Loading bookings…</p>
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="bookings-panel bookings-panel-center">
                <CalendarClock className="bookings-empty-icon" size={28} aria-hidden />
                <p className="bookings-empty-title">{bookingsTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}</p>
              </div>
            ) : (
              visibleBookings.map((booking, index) => (
                <article
                  key={booking.id}
                  className="bookings-card admin-booking-card"
                  style={{ animation: `fadeUp 260ms ease-out ${index * 40}ms both` }}
                >
                  <div className="bookings-card-main">
                    <div className="bookings-card-head">
                      <h2>{booking.space_name}</h2>
                      <span className="bookings-status-pill">{booking.status}</span>
                    </div>
                    <p className="bookings-card-subtitle">{booking.title}</p>
                    <p className="admin-booking-user">{booking.user_email}</p>
                    <div className="bookings-meta-grid">
                      <div className="bookings-meta-item">
                        <CalendarClock size={16} aria-hidden />
                        <span>{formatBookingDateTime(booking.start_time)}</span>
                      </div>
                      <div className="bookings-meta-item">
                        <span>{formatBookingTimeRange(booking.start_time, booking.end_time)}</span>
                      </div>
                    </div>
                  </div>
                  {bookingsTab === 'upcoming' ? (
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
        </section>
      ) : null}

      {tab === 'layout' ? (
        <section className="admin-layout-section">
          <FloorPlanEditorPage embedded />
        </section>
      ) : null}

      {tab === 'offices' ? (
        <section className="admin-section admin-offices-grid">
          <form className="app-panel admin-office-form" onSubmit={(e) => void createOffice(e)}>
            <p className="app-kicker">Add office</p>
            <h2 className="admin-form-title">Register a new floor</h2>
            <label className="admin-field">
              Office name
              <input
                className="admin-input"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="e.g. Birmingham Office"
                required
              />
            </label>
            <label className="admin-field">
              Floor number
              <input
                className="admin-input"
                type="number"
                min={-5}
                max={200}
                value={officeFloorNumber}
                onChange={(e) => setOfficeFloorNumber(Number(e.target.value) || 1)}
              />
            </label>
            <button type="submit" className="btn-primary admin-submit" disabled={creatingOffice}>
              {creatingOffice ? 'Creating…' : 'Create office'}
            </button>
            <p className="admin-form-hint">
              Use the Floor layout tab to upload a plan image and place desks or rooms. Export JSON and add spaces via the API or seed.
            </p>
          </form>

          <div className="admin-inventory">
            <p className="app-kicker">Active offices</p>
            <div className="admin-floor-list">
              {floors.map((floor) => (
                <article key={floor.id} className="app-card admin-floor-card">
                  <strong>{floor.name}</strong>
                  <span>Floor {floor.floor_number}</span>
                  <small>{spaces.filter((s) => s.floor_id === floor.id).length} spaces</small>
                </article>
              ))}
            </div>

            <p className="app-kicker admin-inventory-kicker">Space inventory</p>
            <div className="admin-space-grid">
              {spaces.slice(0, 12).map((space, index) => (
                <article key={space.id} className="app-card admin-space-card" style={{ animation: `fadeUp 240ms ease-out ${index * 35}ms both` }}>
                  <div className="admin-space-head">
                    <span>{space.name}</span>
                    <span className="admin-space-capacity">{space.capacity}</span>
                  </div>
                  <p>{space.zone}</p>
                  <small>{space.type === 'hot_desk' ? 'Hot desk' : 'Meeting room'}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PageLayout>
  );
}
