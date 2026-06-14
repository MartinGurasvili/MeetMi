import { NavLink } from 'react-router-dom';
import { Monitor, Users, Wifi, Zap } from 'lucide-react';
import MeetingRoomTimeline from './MeetingRoomTimeline';
import type { Space } from '../types';

export type SpaceAvailabilityKind = 'available' | 'booked' | 'mine' | 'weekend';

interface Props {
  space: Space | null;
  onBook: () => void;
  onBookRange?: (startIso: string, endIso: string) => void;
  onCancel?: () => void;
  availability: SpaceAvailabilityKind;
  isLoggedIn: boolean;
  hint?: string;
  canBook?: boolean;
  cancelling?: boolean;
  bookingSubmitting?: boolean;
  bookingDate?: string;
  timelineRefreshKey?: number;
}

function availabilityCopy(space: Space, availability: SpaceAvailabilityKind) {
  if (availability === 'available' && space.type === 'hot_desk') {
    return 'Available for the full working day (9:00–17:00).';
  }
  if (availability === 'mine' && space.type === 'hot_desk') {
    return 'You have this desk booked for the full day (9:00–17:00).';
  }
  if (availability === 'booked' && space.type === 'hot_desk') {
    return 'Booked for the full day — cannot be reserved.';
  }
  const defaults: Record<SpaceAvailabilityKind, string> = {
    available: 'Available for the selected time.',
    booked: 'Booked for the selected time — cannot be reserved.',
    mine: 'You have this space booked for the selected time.',
    weekend: 'Weekends are not bookable — choose a weekday.',
  };
  return defaults[availability];
}

export default function SpaceDetailsDrawer({
  space,
  onBook,
  onBookRange,
  onCancel,
  availability,
  isLoggedIn,
  hint,
  canBook = true,
  cancelling = false,
  bookingSubmitting = false,
  bookingDate,
  timelineRefreshKey = 0,
}: Props) {
  if (!space) return null;

  const typeLabel = space.type === 'hot_desk' ? 'Hot desk' : 'Meeting room';
  const fallbackEquipment = space.equipment.slice(0, 3).map((item) => item.name).join(', ');

  const variant = (space.id % 2) + 1;
  const fallbackImage =
    space.type === 'hot_desk' ? `/spaces/hotdesk-${variant}.png` : `/spaces/meetingroom-${variant}.png`;
  const previewSrc = space.image_url ?? fallbackImage;

  return (
    <div className="space-details-root">

      <div className="space-details-hero">
        <img
          key={previewSrc}
          src={previewSrc}
          alt={`${space.name} preview`}
          className="space-details-hero-img"
          loading="lazy"
        />
        <div className="space-details-hero-grad" aria-hidden>
          <span className="space-details-badge">{typeLabel}</span>
        </div>
      </div>

      <div className="space-details-scroll">
        <p className={`space-details-availability is-${availability}`}>{availabilityCopy(space, availability)}</p>
        {hint ? <p className="space-details-hint">{hint}</p> : null}

        <div className="space-details-stats">
          <div className="space-details-stat">
            <Users size={17} aria-hidden />
            <strong>{space.capacity}</strong>
            <span>Capacity</span>
          </div>
          <div className="space-details-stat">
            <Zap size={17} aria-hidden />
            <strong className="space-details-stat-zone">{space.zone}</strong>
            <span>Zone</span>
          </div>
        </div>

        {space.description ? <p className="space-details-desc">{space.description}</p> : null}

        <div className="space-details-card">
          <div className="space-details-card-head">
            <Monitor size={16} aria-hidden />
            <span>Best for</span>
          </div>
          <p className="space-details-card-body">{fallbackEquipment || 'Focused work and collaboration'}</p>
        </div>

        <div className="space-details-equip">
          <div className="space-details-card-head">
            <Wifi size={16} aria-hidden />
            <span>Equipment</span>
          </div>
          <div className="space-details-chip-row">
            {space.equipment.map((item) => (
              <span key={item.id} className="space-details-chip">
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {space.type === 'meeting_room' && bookingDate && onBookRange ? (
          <MeetingRoomTimeline
            spaceId={space.id}
            date={bookingDate}
            onBookRange={onBookRange}
            bookingSubmitting={bookingSubmitting}
            refreshKey={timelineRefreshKey}
          />
        ) : null}
      </div>

      <div className="space-details-footer">
        {availability === 'mine' ? (
          <button
            type="button"
            className="space-details-book space-details-book-cancel"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </button>
        ) : availability === 'available' && isLoggedIn && canBook ? (
          <button type="button" className="space-details-book" onClick={onBook} disabled={bookingSubmitting}>
            {bookingSubmitting ? 'Booking…' : 'Quick book'}
          </button>
        ) : availability === 'available' && isLoggedIn ? (
          <button type="button" className="space-details-book space-details-book-disabled" disabled>
            Unavailable
          </button>
        ) : availability === 'available' ? (
          <NavLink to="/login" className="space-details-book space-details-book-login">
            Log in to book
          </NavLink>
        ) : (
          <button type="button" className="space-details-book space-details-book-disabled" disabled>
            {availability === 'booked' ? 'Booked — unavailable' : 'Unavailable'}
          </button>
        )}
      </div>
    </div>
  );
}
