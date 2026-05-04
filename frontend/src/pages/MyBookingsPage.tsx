import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../types';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => { api.myBookings().then(setBookings).catch(() => setBookings([])); }, []);
  return <main className="mx-auto max-w-5xl px-6 py-10"><h1 className="text-3xl font-semibold">My bookings</h1><div className="mt-6 grid gap-3">{bookings.length === 0 && <p className="glass rounded-2xl p-5 text-slate-300">No bookings yet.</p>}{bookings.map((booking) => <article key={booking.id} className="glass rounded-2xl p-5"><div className="flex justify-between"><h2 className="font-semibold">{booking.title}</h2><span className="text-cyan-200">{booking.status}</span></div><p className="mt-2 text-sm text-slate-300">{booking.space?.name} . {new Date(booking.start_time).toLocaleString()}</p></article>)}</div></main>;
}
