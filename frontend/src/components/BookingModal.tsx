import { useEffect } from 'react';
import { CalendarCheck, Clock, Users, X } from 'lucide-react';
import type { Filters, Space } from '../types';

interface Props {
  space: Space | null;
  filters: Filters;
  onClose: () => void;
  onConfirm: () => void;
}

export default function BookingModal({ space, filters, onClose, onConfirm }: Props) {
  useEffect(() => {
    if (!space) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [space, onClose]);

  if (!space) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={onClose}
    >
      <div
        className="surface-panel w-full max-w-md rounded-lg p-4 shadow-[var(--shadow-panel)] animate-[fadeUp_240ms_ease-out] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]">
              <CalendarCheck size={22} aria-hidden />
            </span>
            <div>
              <h2 id="booking-modal-title" className="text-xl font-black tracking-tight text-[var(--color-text)]">
                Confirm booking
              </h2>
              <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">{space.name}</p>
            </div>
          </div>
          <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={onClose} aria-label="Close booking modal">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-solid)_70%,transparent)] p-3">
          <div className="flex items-center gap-3">
            <CalendarCheck size={17} className="text-[var(--color-primary)]" aria-hidden />
            <span className="text-sm font-bold text-[var(--color-text)]">{filters.date}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={17} className="text-[var(--color-accent)]" aria-hidden />
            <span className="text-sm font-bold text-[var(--color-text)]">
              {filters.start}-{filters.end}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={17} className="text-[var(--color-info)]" aria-hidden />
            <span className="text-sm font-bold text-[var(--color-text)]">
              {filters.attendeeCount} {filters.attendeeCount === 1 ? 'attendee' : 'attendees'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
