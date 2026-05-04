import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Space } from '../types';

export default function AdminPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  useEffect(() => { api.spaces().then(setSpaces).catch(() => setSpaces([])); }, []);
  return <main className="mx-auto max-w-6xl px-6 py-10"><div className="glass rounded-[2rem] p-6"><p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Admin</p><h1 className="mt-2 text-3xl font-semibold">Space management preview</h1><p className="mt-2 text-slate-300">Admins can manage floors, spaces, bookings, audit logs, and generated image prompts through the protected API.</p><div className="mt-6 grid gap-3 md:grid-cols-2">{spaces.slice(0, 8).map((space) => <article key={space.id} className="rounded-2xl bg-white/10 p-4"><div className="flex justify-between"><span className="font-semibold">{space.name}</span><span>{space.capacity} seats</span></div><p className="mt-1 text-sm text-slate-400">{space.zone} . {space.equipment.map((e) => e.name).join(', ')}</p></article>)}</div></div></main>;
}
