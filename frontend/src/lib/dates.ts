import type { Filters } from '../types';

/** ISO date string `YYYY-MM-DD` in local calendar terms. */
export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function isWeekendDate(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) return false;
  const day = parsed.getDay();
  return day === 0 || day === 6;
}

export function nextWeekdayIso(from = new Date()) {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return toIsoDate(cursor);
}

export function normalizeWeekdayDate(value: string) {
  if (!isWeekendDate(value)) return value;
  const parsed = parseIsoDate(value);
  if (!parsed) return nextWeekdayIso();
  while (parsed.getDay() === 0 || parsed.getDay() === 6) {
    parsed.setDate(parsed.getDate() + 1);
  }
  return toIsoDate(parsed);
}

export function formatDashboardDate(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) return 'Choose date';

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parsed);
}

export const DESK_DAY_START = '09:00';
export const DESK_DAY_END = '17:00';

export function isSameBookingDay(isoDateTime: string, date: string) {
  const parsed = parseIsoDate(date);
  if (!parsed) return false;
  const bookingDate = new Date(isoDateTime);
  return (
    bookingDate.getUTCFullYear() === parsed.getFullYear() &&
    bookingDate.getUTCMonth() === parsed.getMonth() &&
    bookingDate.getUTCDate() === parsed.getDate()
  );
}

export function bookingWindowForSpace(spaceType: 'hot_desk' | 'meeting_room', filters: Pick<Filters, 'date' | 'start' | 'end'>) {
  if (spaceType === 'hot_desk') {
    return {
      start_time: `${filters.date}T${DESK_DAY_START}:00`,
      end_time: `${filters.date}T${DESK_DAY_END}:00`,
    };
  }
  return filtersToWindowIso(filters);
}

export function formatDeskDayLabel() {
  return `All day (${DESK_DAY_START}–${DESK_DAY_END})`;
}

export function filtersToWindowIso(filters: Pick<Filters, 'date' | 'start' | 'end'>) {
  return {
    start_time: `${filters.date}T${filters.start}:00`,
    end_time: `${filters.date}T${filters.end}:00`,
  };
}

export function formatBookingDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatBookingTimeRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
