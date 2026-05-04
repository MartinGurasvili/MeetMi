import { useEffect, useState } from 'react';
import { Building2, Database, Layers3, Users } from 'lucide-react';
import { api } from '../api/client';
import PageLayout from '../components/PageLayout';
import type { Space } from '../types';

export default function AdminPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);

  useEffect(() => {
    api.spaces().then(setSpaces).catch(() => setSpaces([]));
  }, []);

  const roomCount = spaces.filter((space) => space.type === 'meeting_room').length;
  const deskCount = spaces.filter((space) => space.type === 'hot_desk').length;
  const capacity = spaces.reduce((sum, space) => sum + space.capacity, 0);

  return (
    <PageLayout>
      <section className="surface-panel rounded-lg p-4 animate-[fadeUp_280ms_ease-out] sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-primary)]">Administration</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">Space management</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-[var(--color-muted)]">
              Active workspace inventory from the protected API.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="mini-stat rounded-lg p-3">
              <Building2 size={17} className="text-[var(--color-primary)]" aria-hidden />
              <p className="mt-2 text-xl font-black text-[var(--color-text)]">{deskCount}</p>
              <p className="text-xs font-bold text-[var(--color-muted)]">Desks</p>
            </div>
            <div className="mini-stat rounded-lg p-3">
              <Layers3 size={17} className="text-[var(--color-accent)]" aria-hidden />
              <p className="mt-2 text-xl font-black text-[var(--color-text)]">{roomCount}</p>
              <p className="text-xs font-bold text-[var(--color-muted)]">Rooms</p>
            </div>
            <div className="mini-stat rounded-lg p-3">
              <Users size={17} className="text-[var(--color-info)]" aria-hidden />
              <p className="mt-2 text-xl font-black text-[var(--color-text)]">{capacity}</p>
              <p className="text-xs font-bold text-[var(--color-muted)]">Seats</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.slice(0, 9).map((space, index) => (
            <article
              key={space.id}
              className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-solid)_72%,transparent)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-solid)] hover:shadow-[var(--shadow-soft)]"
              style={{ animation: `fadeUp 240ms ease-out ${index * 45}ms both` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate font-black text-[var(--color-text)]">{space.name}</span>
                <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--color-primary-strong)]">
                  {space.capacity}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{space.zone}</p>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-[var(--color-muted)]">
                {space.equipment.map((item) => item.name).join(', ')}
              </p>
            </article>
          ))}
        </div>

        {spaces.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-[var(--color-border-strong)] px-5 py-10 text-center">
            <Database className="mx-auto text-[var(--color-muted)]" size={28} aria-hidden />
            <p className="mt-3 text-sm font-black text-[var(--color-text)]">No spaces loaded</p>
          </div>
        ) : null}
      </section>
    </PageLayout>
  );
}
