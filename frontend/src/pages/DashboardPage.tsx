import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Check, ChevronDown, MapPinned, Sparkles, UserCircle, Users, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from '../components/BookingModal';
import FloorPlan from '../components/FloorPlan';
import OfficeMapPanel from '../components/OfficeMapPanel';
import SpaceDetailsDrawer from '../components/SpaceDetailsDrawer';
import { demoEquipment, demoFloors, demoSpaces, mergeApiSpacesWithLayoutFloors } from '../data/demo';
import { floorLayoutForFloor } from '../data/floorLayoutRegistry';
import type { Filters, Recommendation, Space } from '../types';

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const initialFilters: Filters = {
  date: tomorrow,
  start: '09:00',
  end: '10:00',
  spaceType: 'hot_desk',
  attendeeCount: 1,
  requiredEquipmentIds: [],
  optionalEquipmentIds: [],
  preferredZone: '',
};

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [floorId, setFloorId] = useState(1);
  const [spaces, setSpaces] = useState(demoSpaces);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingAuthMessage, setBookingAuthMessage] = useState('');
  const [officeMenuOpen, setOfficeMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const officeWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('dashboard-route');
    return () => document.body.classList.remove('dashboard-route');
  }, []);

  useEffect(() => {
    api.spaces().then((apiSpaces) => setSpaces(mergeApiSpacesWithLayoutFloors(apiSpaces))).catch(() => setSpaces(demoSpaces));
  }, []);

  useEffect(() => {
    api.recommendations(filters).then(setRecommendations).catch(() => setRecommendations([]));
  }, [filters]);

  useEffect(() => {
    if (!officeMenuOpen && !profileMenuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (officeMenuOpen && officeWrapRef.current && !officeWrapRef.current.contains(target)) {
        setOfficeMenuOpen(false);
      }
      if (profileMenuOpen && profileWrapRef.current && !profileWrapRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [officeMenuOpen, profileMenuOpen]);

  const visibleSpaces = useMemo(
    () =>
      spaces.filter(
        (space) =>
          space.floor_id === floorId &&
          space.type === filters.spaceType &&
          space.capacity >= filters.attendeeCount &&
          filters.requiredEquipmentIds.every((id) => space.equipment.some((item) => item.id === id)),
      ),
    [spaces, floorId, filters],
  );

  /** Layout floors show every desk/room on the image; the rail list still uses `spaceType` via `visibleSpaces`. */
  const mapSpaces = useMemo(() => {
    if (!floorLayoutForFloor(floorId)) return visibleSpaces;
    return spaces.filter(
      (space) =>
        space.floor_id === floorId &&
        space.capacity >= filters.attendeeCount &&
        filters.requiredEquipmentIds.every((id) => space.equipment.some((item) => item.id === id)),
    );
  }, [spaces, floorId, filters, visibleSpaces]);

  const selectedSpace = selected ? spaces.find((space) => space.id === selected.id) ?? selected : null;
  const selectedVisible = selectedSpace && selectedSpace.floor_id === floorId ? selectedSpace : null;

  function handleSelectSpace(space: Space) {
    setSelected(space);
    setBookingAuthMessage('');
  }

  function handleFloorChange(newFloorId: number) {
    setFloorId(newFloorId);
    if (selected && selected.floor_id !== newFloorId) {
      setSelected(null);
    }
  }

  function pickFloor(newFloorId: number) {
    handleFloorChange(newFloorId);
    setOfficeMenuOpen(false);
  }

  function handleRecommendationSelect(spaceId: number) {
    const space = spaces.find((s) => s.id === spaceId) ?? null;
    if (space) {
      setFloorId(space.floor_id);
      setSelected(space);
    }
  }

  async function confirmBooking() {
    if (!selectedSpace) return;
    try {
      await api.createBooking({
        space_id: selectedSpace.id,
        title: `MeetMi booking for ${selectedSpace.name}`,
        start_time: `${filters.date}T${filters.start}:00`,
        end_time: `${filters.date}T${filters.end}:00`,
        attendee_count: filters.attendeeCount,
      });
      setBookingOpen(false);
    } catch {
      setBookingOpen(false);
    }
  }

  const selectedFloor = demoFloors.find((floor) => floor.id === floorId);

  function requestBooking() {
    if (authLoading) {
      setBookingAuthMessage('Checking your account before booking.');
      return;
    }
    if (!user) {
      setBookingAuthMessage('Please log in before booking this space.');
      return;
    }
    setBookingAuthMessage('');
    setBookingOpen(true);
  }

  const mapCard = (
    <div className="dashboard-map-card">
      <FloorPlan
        spaces={mapSpaces}
        selectedSpace={selectedVisible}
        recommendedSpaceIds={recommendations.map((r) => r.space.id)}
        onSelectSpace={handleSelectSpace}
        floorId={floorId}
        layout={floorLayoutForFloor(floorId) ?? null}
      />
    </div>
  );

  const profileLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'dashboard-profile-link is-active' : 'dashboard-profile-link';

  return (
    <main className="dashboard-page">
      <section className="dashboard-stage" aria-label="Apple Maps style workspace finder">
        <div className="dashboard-map-layer">{mapCard}</div>

        <div className="dashboard-left-rail">
          <section className="dashboard-search-panel" aria-label="Workspace search summary">
            <div className="dashboard-search-panel-row">
              <p className="dashboard-kicker">MeetMi Maps</p>
              <div className="dashboard-profile-wrap" ref={profileWrapRef}>
                <button
                  type="button"
                  className="dashboard-profile-trigger"
                  aria-label="Account menu"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setProfileMenuOpen((open) => !open);
                    setOfficeMenuOpen(false);
                  }}
                >
                  <UserCircle size={22} strokeWidth={1.75} aria-hidden />
                </button>
                {profileMenuOpen ? (
                  <div className="dashboard-profile-menu" role="menu">
                    {authLoading ? (
                      <span className="dashboard-profile-placeholder">Loading…</span>
                    ) : !user ? (
                      <NavLink to="/login" role="menuitem" className={profileLinkClass} onClick={() => setProfileMenuOpen(false)}>
                        Log in
                      </NavLink>
                    ) : user.role === 'admin' ? (
                      <>
                        <NavLink to="/admin" role="menuitem" className={profileLinkClass} onClick={() => setProfileMenuOpen(false)}>
                          Admin
                        </NavLink>
                        <button
                          type="button"
                          role="menuitem"
                          className="dashboard-profile-link"
                          onClick={() => {
                            void signOut();
                            setProfileMenuOpen(false);
                          }}
                        >
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <NavLink to="/bookings" role="menuitem" className={profileLinkClass} onClick={() => setProfileMenuOpen(false)}>
                          Bookings
                        </NavLink>
                        <button
                          type="button"
                          role="menuitem"
                          className="dashboard-profile-link"
                          onClick={() => {
                            void signOut();
                            setProfileMenuOpen(false);
                          }}
                        >
                          Sign out
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <h1>Find a space nearby</h1>
            <p>
              {filters.spaceType === 'hot_desk' ? 'Hot desks' : 'Meeting rooms'} for {filters.attendeeCount}{' '}
              {filters.attendeeCount === 1 ? 'person' : 'people'} in {selectedFloor?.name ?? 'the office'}.
            </p>

            <div className="dashboard-office-wrap" ref={officeWrapRef}>
              <button
                type="button"
                id="dashboard-office-trigger"
                className="dashboard-office-trigger"
                aria-expanded={officeMenuOpen}
                aria-controls="dashboard-office-menu"
                onClick={() => {
                  setOfficeMenuOpen((open) => !open);
                  setProfileMenuOpen(false);
                }}
              >
                <MapPinned size={18} aria-hidden />
                <span className="dashboard-office-trigger-text">
                  <span className="dashboard-office-name">{selectedFloor?.name ?? 'Choose office'}</span>
                  <span className="dashboard-office-floor">
                    Floor {selectedFloor?.floor_number ?? '—'} · Tap to change
                  </span>
                </span>
                <ChevronDown size={18} className={officeMenuOpen ? 'dashboard-chevron is-open' : 'dashboard-chevron'} aria-hidden />
              </button>

              {officeMenuOpen ? (
                <div id="dashboard-office-menu" className="dashboard-office-menu" role="region" aria-labelledby="dashboard-office-trigger">
                  
                  <div className="dashboard-floor-list">
                    {demoFloors.map((floor) => (
                      <button
                        key={floor.id}
                        type="button"
                        className={floor.id === floorId ? 'dashboard-floor-button is-active' : 'dashboard-floor-button'}
                        onClick={() => pickFloor(floor.id)}
                        aria-pressed={floor.id === floorId}
                      >
                        <span>
                          <span>{floor.name}</span>
                          <small>Floor {floor.floor_number}</small>
                        </span>
                        {floor.id === floorId ? <Check size={17} aria-hidden /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="dashboard-stat-grid" aria-label="Current search stats">
              <div className="dashboard-stat">
                <MapPinned size={17} aria-hidden />
                <strong>{visibleSpaces.length}</strong>
                <span>Matches</span>
              </div>
              <div className="dashboard-stat">
                <Sparkles size={17} aria-hidden />
                <strong>{recommendations.length}</strong>
                <span>Ranked</span>
              </div>
              <div className="dashboard-stat">
                <Users size={17} aria-hidden />
                <strong>{filters.attendeeCount}</strong>
                <span>People</span>
              </div>
              <div className="dashboard-stat">
                <CalendarDays size={17} aria-hidden />
                <strong>{filters.start}</strong>
                <span>Start</span>
              </div>
            </div>
          </section>

          <OfficeMapPanel
            filters={filters}
            equipment={demoEquipment}
            onFiltersChange={setFilters}
            recommendations={recommendations}
            onRecommendationSelect={handleRecommendationSelect}
          />

          {selectedSpace ? (
            <section className="dashboard-panel dashboard-about-panel" aria-label={`About ${selectedSpace.name}`}>
              <div className="dashboard-about-header">
                <div>
                  <p className="dashboard-label">About</p>
                  <h2>{selectedSpace.name}</h2>
                </div>
                <button type="button" className="dashboard-icon-button" onClick={() => setSelected(null)} aria-label="Close details">
                  <X size={18} aria-hidden />
                </button>
              </div>
              <SpaceDetailsDrawer
                space={selectedSpace}
                onBook={requestBooking}
              />
              {bookingAuthMessage ? <p className="space-details-auth-message space-details-auth-message-inline">{bookingAuthMessage}</p> : null}
            </section>
          ) : null}
        </div>
      </section>

      <BookingModal
        space={bookingOpen ? selectedSpace : null}
        filters={filters}
        onClose={() => setBookingOpen(false)}
        onConfirm={confirmBooking}
      />
    </main>
  );
}
