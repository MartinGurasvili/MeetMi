import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { DESK_DAY_END, DESK_DAY_START } from '../lib/dates';
import type { RoomDayBooking } from '../types';

type SlotState = 'free' | 'booked' | 'mine';

interface SlotRow {
  label: string;
  start: string;
  end: string;
  state: SlotState;
}

interface Props {
  spaceId: number;
  date: string;
  onBookRange: (start: string, end: string) => void;
  bookingSubmitting?: boolean;
  refreshKey?: number;
}

const SLOT_MINUTES = 30;

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildSlots(dayBookings: RoomDayBooking[], bookingDate: string): SlotRow[] {
  const dayStart = parseTimeToMinutes(DESK_DAY_START);
  const dayEnd = parseTimeToMinutes(DESK_DAY_END);
  const rows: SlotRow[] = [];

  for (let minute = dayStart; minute < dayEnd; minute += SLOT_MINUTES) {
    const slotStart = `${bookingDate}T${minutesToTime(minute)}:00`;
    const slotEnd = `${bookingDate}T${minutesToTime(minute + SLOT_MINUTES)}:00`;
    const slotStartDate = new Date(slotStart);
    const slotEndDate = new Date(slotEnd);

    let state: SlotState = 'free';
    for (const booking of dayBookings) {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      if (slotStartDate < bookingEnd && slotEndDate > bookingStart) {
        state = booking.mine ? 'mine' : 'booked';
        break;
      }
    }

    rows.push({
      label: minutesToTime(minute),
      start: minutesToTime(minute),
      end: minutesToTime(minute + SLOT_MINUTES),
      state,
    });
  }

  return rows;
}

function rangeIsFree(slots: SlotRow[], startIndex: number, endIndex: number) {
  if (startIndex < 0 || endIndex >= slots.length || startIndex > endIndex) return false;
  return slots.slice(startIndex, endIndex + 1).every((slot) => slot.state === 'free');
}

export default function MeetingRoomTimeline({ spaceId, date, onBookRange, bookingSubmitting = false, refreshKey = 0 }: Props) {
  const [dayBookings, setDayBookings] = useState<RoomDayBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .roomDayBookings(spaceId, date)
      .then((bookings) => {
        if (!cancelled) setDayBookings(bookings);
      })
      .catch(() => {
        if (!cancelled) setDayBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, date, refreshKey]);

  const slots = useMemo(() => buildSlots(dayBookings, date), [dayBookings, date]);

  useEffect(() => {
    setRangeStart(null);
    setRangeEnd(null);
  }, [spaceId, date]);

  function handleSlotClick(index: number) {
    const slot = slots[index];
    if (slot.state !== 'free') return;

    if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
      setRangeStart(index);
      setRangeEnd(null);
      return;
    }

    if (index < rangeStart) {
      setRangeStart(index);
      setRangeEnd(null);
      return;
    }

    if (!rangeIsFree(slots, rangeStart, index)) {
      setRangeStart(index);
      setRangeEnd(null);
      return;
    }

    setRangeEnd(index);
  }

  const selectedLabel =
    rangeStart !== null && rangeEnd !== null
      ? `${slots[rangeStart].start}–${slots[rangeEnd].end}`
      : rangeStart !== null
        ? `${slots[rangeStart].start}–${slots[rangeStart].end}`
        : null;

  return (
    <div className="room-timeline">
      <div className="room-timeline-head">
        <p className="dashboard-label">Availability</p>
        <p className="room-timeline-subtle">{loading ? 'Loading slots…' : 'Tap a free slot to start, then tap the end time.'}</p>
      </div>

      <div className="room-timeline-grid" role="list" aria-label="Meeting room time slots">
        {slots.map((slot, index) => {
          const inRange =
            rangeStart !== null &&
            rangeEnd !== null &&
            index >= rangeStart &&
            index <= rangeEnd;
          const isStart = rangeStart === index;
          const isEnd = rangeEnd === index;
          return (
            <button
              key={slot.label}
              type="button"
              role="listitem"
              className={[
                'room-timeline-slot',
                `is-${slot.state}`,
                inRange ? 'is-selected' : '',
                isStart ? 'is-range-start' : '',
                isEnd ? 'is-range-end' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={slot.state !== 'free' || bookingSubmitting}
              onClick={() => handleSlotClick(index)}
              aria-pressed={inRange || isStart}
            >
              <span>{slot.label}</span>
              <span>{slot.state === 'free' ? 'Free' : slot.state === 'mine' ? 'Your booking' : 'Booked'}</span>
            </button>
          );
        })}
      </div>

      {selectedLabel && rangeStart !== null && rangeEnd !== null ? (
        <button
          type="button"
          className="room-timeline-book"
          disabled={bookingSubmitting}
          onClick={() => onBookRange(`${date}T${slots[rangeStart].start}:00`, `${date}T${slots[rangeEnd].end}:00`)}
        >
          {bookingSubmitting ? 'Booking…' : `Book ${selectedLabel}`}
        </button>
      ) : null}
    </div>
  );
}
