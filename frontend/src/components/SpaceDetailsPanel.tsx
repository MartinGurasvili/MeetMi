import type { Space } from '../types';
interface Props { space: Space | null; onBook: () => void }
export default function SpaceDetailsPanel({ space, onBook }: Props) {
  if (!space) return <aside className="glass rounded-[2rem] p-5 text-slate-300">Select a marker to inspect a desk or meeting room.</aside>;
  return <aside className="glass rounded-[2rem] p-5"><p className="text-xs uppercase tracking-[0.35em] text-cyan-200">{space.type.replace('_', ' ')}</p><h2 className="mt-2 text-2xl font-semibold">{space.name}</h2><p className="mt-2 text-slate-300">{space.description}</p><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-400">Zone</dt><dd>{space.zone}</dd></div><div><dt className="text-slate-400">Capacity</dt><dd>{space.capacity}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{space.equipment.map((item) => <span key={item.id} className="rounded-full bg-white/10 px-3 py-1 text-xs">{item.name}</span>)}</div><button onClick={onBook} className="mt-6 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 shadow-glow">Book this space</button></aside>;
}
