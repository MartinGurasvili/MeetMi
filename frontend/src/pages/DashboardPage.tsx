import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Check, ChevronDown, MapPinned, UserCircle, Users, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AppToast, { type AppToastTone } from '../components/AppToast';
import FloorPlan from '../components/FloorPlan';
import OfficeMapPanel from '../components/OfficeMapPanel';
import SpaceDetailsDrawer, { type SpaceAvailabilityKind } from '../components/SpaceDetailsDrawer';
import { demoEquipment, demoFloors, demoSpaces, mergeApiSpacesWithLayoutFloors } from '../data/demo';
import { floorLayoutForFloor } from '../data/floorLayoutRegistry';
import { resolveUserBooking, userHasDeskOnDate } from '../lib/bookings';
import { bookingWindowForSpace, filtersToWindowIso, formatDashboardDate, isWeekendDate, nextWeekdayIso, normalizeWeekdayDate } from '../lib/dates';
import { parsedMeetingToFilters } from '../lib/ics';
import type { Booking, Filters, ParsedIcsMeeting, Recommendation, Space } from '../types';

const initialFilters: Filters = {
  date: nextWeekdayIso(),
  start: '09:00',
  end: '10:00',
  spaceType: 'hot_desk',
  attendeeCount: 1,
  requiredEquipmentIds: [],
  optionalEquipmentIds: [],
  preferredZone: '',
};

function updateFiltersDate(current: Filters, date: string): Filters {
  return { ...current, date: normalizeWeekdayDate(date) };
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [floorId, setFloorId] = useState(1);
  const [spaces, setSpaces] = useState(demoSpaces);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [bookedSpaceIds, setBookedSpaceIds] = useState<number[]>([]);
  const [myBookedSpaceIds, setMyBookedSpaceIds] = useState<number[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone }>({ message: '', tone: 'info' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [officeMenuOpen, setOfficeMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const officeWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast.message) return;
    const timer = window.setTimeout(() => setToast({ message: '', tone: 'info' }), 5000);
    return () => window.clearTimeout(timer);
  }, [toast.message]);

  const refreshAvailability = useCallback(async () => {
    try {
      const summary = await api.availability(filters);
      setBookedSpaceIds(summary.booked_space_ids);
      setMyBookedSpaceIds(summary.my_space_ids);
    } catch {
      setBookedSpaceIds([]);
      setMyBookedSpaceIds([]);
    }
  }, [filters]);

  useEffect(() => {
    api.spaces().then((apiSpaces) => setSpaces(mergeApiSpacesWithLayoutFloors(apiSpaces))).catch(() => setSpaces(demoSpaces));
  }, []);

  useEffect(() => {
    api.recommendations(filters).then(setRecommendations).catch(() => setRecommendations([]));
    void refreshAvailability();
  }, [filters, refreshAvailability]);

  useEffect(() => {
    setSelected(null);
    setToast({ message: '', tone: 'info' });
  }, [filters.date]);

  useEffect(() => {
    if (authLoading || !user) {
      setMyBookings([]);
      return;
    }
    api.myBookings().then(setMyBookings).catch(() => setMyBookings([]));
  }, [authLoading, user, filters.date]);

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

  const availableMatchCount = useMemo(
    () => visibleSpaces.filter((space) => !bookedSpaceIds.includes(space.id)).length,
    [visibleSpaces, bookedSpaceIds],
  );

  const mapSpaces = useMemo(() => {
    if (!floorLayoutForFloor(floorId)) return visibleSpaces;
    return spaces.filter(
      (space) =>
        space.floor_id === floorId &&
        space.capacity >= filters.attendeeCount &&
        filters.requiredEquipmentIds.every((id) => space.equipment.some((item) => item.id === id)),
    );
  }, [spaces, floorId, filters, visibleSpaces]);

  const windowIso = useMemo(() => filtersToWindowIso(filters), [filters]);
  const selectedSpace = selected ? spaces.find((space) => space.id === selected.id) ?? selected : null;
  const selectedVisible = selectedSpace && selectedSpace.floor_id === floorId ? selectedSpace : null;
  const weekendSelected = isWeekendDate(filters.date);
  const selectedUserBooking = useMemo(
    () => (selectedSpace ? resolveUserBooking(myBookings, selectedSpace, filters.date, windowIso) : null),
    [selectedSpace, myBookings, filters.date, windowIso],
  );
  const selectedIsMine = Boolean(selectedUserBooking) || Boolean(selectedSpace && myBookedSpaceIds.includes(selectedSpace.id));
  const selectedIsBooked = Boolean(selectedSpace && bookedSpaceIds.includes(selectedSpace.id) && !selectedIsMine);
  const hasOtherDeskToday = Boolean(
    user &&
      selectedSpace?.type === 'hot_desk' &&
      !selectedIsMine &&
      userHasDeskOnDate(myBookings, spaces, filters.date, selectedSpace.id),
  );

  const bookedOnFloorCount = useMemo(
    () => mapSpaces.filter((space) => bookedSpaceIds.includes(space.id)).length,
    [mapSpaces, bookedSpaceIds],
  );

  const selectedAvailability: SpaceAvailabilityKind = weekendSelected
    ? 'weekend'
    : selectedIsMine
      ? 'mine'
      : selectedIsBooked
        ? 'booked'
        : 'available';

  function handleSelectSpace(space: Space) {
    setSelected(space);
    setToast({ message: '', tone: 'info' });
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

  async function performBooking(startIso?: string, endIso?: string) {
    if (!selectedSpace || !user) return;
    if (weekendSelected) {
      showToast('Bookings are only available Monday to Friday.', 'error');
      return;
    }
    if (selectedSpace.type === 'hot_desk' && userHasDeskOnDate(myBookings, spaces, filters.date, selectedSpace.id)) {
      showToast('You already have a desk booked for this day. Cancel it before booking another.', 'error');
      return;
    }
    const window =
      startIso && endIso
        ? { start_time: startIso, end_time: endIso }
        : bookingWindowForSpace(selectedSpace.type, filters);
    setBookingSubmitting(true);
    try {
      try {
        await api.refreshAccessToken();
      } catch {
        /* session may still be valid */
      }
      await api.createBooking({
        space_id: selectedSpace.id,
        title: `MeetMi booking for ${selectedSpace.name}`,
        start_time: window.start_time,
        end_time: window.end_time,
        attendee_count: selectedSpace.type === 'hot_desk' ? 1 : filters.attendeeCount,
      });
      showToast(`${selectedSpace.name} booked successfully.`, 'success');
      const bookings = await api.myBookings();
      setMyBookings(bookings);
      await refreshAvailability();
      setTimelineRefreshKey((value) => value + 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not complete the booking. Try another time or space.', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  }

  async function cancelSelectedBooking() {
    const booking =
      selectedUserBooking ??
      (selectedSpace ? resolveUserBooking(myBookings, selectedSpace, filters.date, windowIso) : null);
    if (!booking) {
      showToast('No active booking found for this space. Try refreshing or pick another date.', 'error');
      return;
    }
    setCancelling(true);
    try {
      await api.cancelBooking(booking.id);
      const bookings = await api.myBookings();
      setMyBookings(bookings);
      await refreshAvailability();
      setTimelineRefreshKey((value) => value + 1);
      showToast('Booking cancelled.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not cancel this booking. Please try again.', 'error');
    } finally {
      setCancelling(false);
    }
  }

  const selectedFloor = demoFloors.find((floor) => floor.id === floorId);

  function handleIcsParsed(meeting: ParsedIcsMeeting) {
    const parsed = parsedMeetingToFilters(meeting);
    setFilters((current) => ({
      ...current,
      ...parsed,
      requiredEquipmentIds: current.requiredEquipmentIds,
      optionalEquipmentIds: current.optionalEquipmentIds,
      preferredZone: current.preferredZone,
    }));
    showToast(`Looking for rooms for "${meeting.summary}".`, 'info');
  }

  function requestBooking() {
    if (authLoading) {
      showToast('Checking your account before booking.', 'info');
      return;
    }
    if (weekendSelected) {
      showToast('Bookings are only available Monday to Friday.', 'error');
      return;
    }
    if (!user) {
      showToast('Please log in before booking this space.', 'error');
      return;
    }
    if (selectedIsBooked || selectedIsMine) {
      return;
    }
    if (hasOtherDeskToday) {
      showToast('You already have a desk booked for this day. Cancel it before booking another.', 'error');
      return;
    }
    void performBooking();
  }

  const profileLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'dashboard-profile-link is-active' : 'dashboard-profile-link';

  return (
    <main className="dashboard-page">
      <AppToast message={toast.message} tone={toast.tone} />

      <section className="dashboard-stage" aria-label="Apple Maps style workspace finder">
        <div className="dashboard-map-layer">
          <div className="dashboard-map-card">
            <FloorPlan
              spaces={mapSpaces}
              selectedSpace={selectedVisible}
              recommendedSpaceIds={recommendations.map((r) => r.space.id)}
              bookedSpaceIds={bookedSpaceIds}
              myBookedSpaceIds={myBookedSpaceIds}
              onSelectSpace={handleSelectSpace}
              floorId={floorId}
              layout={floorLayoutForFloor(floorId) ?? null}
            />
          </div>
        </div>

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
                <strong>{availableMatchCount}</strong>
                <span>Available</span>
              </div>
              <label className="dashboard-stat dashboard-date-filter">
                <CalendarDays size={17} aria-hidden />
                <span className="dashboard-date-filter-copy">
                  <strong>{formatDashboardDate(filters.date)}</strong>
                  <span>Date</span>
                </span>
                <input
                  aria-label="Filter by booking date"
                  type="date"
                  min={nextWeekdayIso()}
                  value={filters.date}
                  onChange={(event) => setFilters((current) => updateFiltersDate(current, event.target.value))}
                />
              </label>
              <div className="dashboard-stat">
                <Users size={17} aria-hidden />
                <strong>{bookedOnFloorCount}</strong>
                <span>Booked</span>
              </div>
            </div>
          </section>

          <OfficeMapPanel
            filters={filters}
            equipment={demoEquipment}
            onFiltersChange={setFilters}
            recommendations={recommendations}
            onRecommendationSelect={handleRecommendationSelect}
            onIcsParsed={handleIcsParsed}
          />
        </div>

        {selectedSpace ? (
          <aside className="dashboard-right-rail" aria-label={`About ${selectedSpace.name}`}>
            <section className="dashboard-panel dashboard-about-panel">
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
                onBookRange={(startIso, endIso) => void performBooking(startIso, endIso)}
                onCancel={() => void cancelSelectedBooking()}
                availability={selectedAvailability}
                isLoggedIn={Boolean(user)}
                hint={
                  hasOtherDeskToday
                    ? 'You already have a desk booked today. Cancel your existing desk booking to switch.'
                    : undefined
                }
                canBook={!hasOtherDeskToday}
                cancelling={cancelling}
                bookingSubmitting={bookingSubmitting}
                bookingDate={filters.date}
                timelineRefreshKey={timelineRefreshKey}
              />
            </section>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
