import type { Filters, Space } from '../types';
interface Props { space: Space | null; filters: Filters; onClose: () => void; onConfirm: () => void }
export default function BookingModal({ space, filters, onClose, onConfirm }: Props) {
  if (!space) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="glass max-w-md rounded-[2rem] p-6"><h2 className="text-2xl font-semibold">Confirm booking</h2><p className="mt-3 text-slate-300">Book <strong>{space.name}</strong> on {filters.date} from {filters.start} to {filters.end} for {filters.attendeeCount} attendee(s).</p><div className="mt-6 flex gap-3"><button className="rounded-2xl bg-white/10 px-4 py-3" onClick={onClose}>Cancel</button><button className="rounded-2xl bg-emerald-300 px-4 py-3 font-semibold text-slate-950" onClick={onConfirm}>Confirm</button></div></div></div>;
}
