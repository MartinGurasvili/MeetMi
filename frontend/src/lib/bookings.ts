import type { Booking, Space } from '../types';
import { bookingWindowForSpace, isSameBookingDay } from './dates';

export function resolveUserBooking(
  bookings: Booking[],
  space: Space,
  date: string,
  window: { start_time: string; end_time: string },
) {
  if (space.type === 'hot_desk') {
    return (
      bookings.find(
        (booking) =>
          booking.space_id === space.id &&
          booking.status === 'confirmed' &&
          isSameBookingDay(booking.start_time, date),
      ) ?? null
    );
  }

  const start = new Date(window.start_time).getTime();
  const end = new Date(window.end_time).getTime();
  return (
    bookings.find((booking) => {
      if (booking.space_id !== space.id || booking.status !== 'confirmed') return false;
      const bStart = new Date(booking.start_time).getTime();
      const bEnd = new Date(booking.end_time).getTime();
      return bStart < end && bEnd > start;
    }) ?? null
  );
}

export function userHasDeskOnDate(bookings: Booking[], spaces: Space[], date: string, excludeSpaceId?: number) {
  return bookings.some((booking) => {
    if (booking.status !== 'confirmed' || !isSameBookingDay(booking.start_time, date)) return false;
    if (booking.space_id === excludeSpaceId) return false;
    const space = booking.space ?? spaces.find((item) => item.id === booking.space_id);
    return space?.type === 'hot_desk';
  });
}

export function bookingWindowForSpaceType(spaceType: Space['type'], filters: { date: string; start: string; end: string }) {
  return bookingWindowForSpace(spaceType, filters);
}
