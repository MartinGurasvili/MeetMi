import { useMemo, useState } from 'react';
import type { Space } from '../types';
import SpaceMarker from './SpaceMarker';

interface Props { spaces: Space[]; selectedSpace?: Space | null; recommendedSpaceIds?: number[]; bookedSpaceIds?: number[]; onSelectSpace: (space: Space) => void }
export default function FloorPlan({ spaces, selectedSpace, recommendedSpaceIds = [], bookedSpaceIds = [], onSelectSpace }: Props) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 820, height: 640 });
  const recommended = useMemo(() => new Set(recommendedSpaceIds), [recommendedSpaceIds]);
  const booked = useMemo(() => new Set(bookedSpaceIds), [bookedSpaceIds]);
  function zoom(delta: number) { setViewBox((box) => { const factor = delta > 0 ? 0.88 : 1.12; const width = Math.min(1100, Math.max(420, box.width * factor)); const height = Math.min(820, Math.max(320, box.height * factor)); return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }; }); }
  function markerState(space: Space) { if (selectedSpace?.id === space.id) return 'selected' as const; if (recommended.has(space.id)) return 'recommended' as const; if (booked.has(space.id)) return 'booked' as const; return 'available' as const; }
  return <section className="glass relative min-h-[560px] overflow-hidden rounded-[2rem] p-4" aria-label="Interactive office floor plan"><div className="absolute right-5 top-5 z-10 flex gap-2"><button className="rounded-full bg-white/10 px-3 py-1 text-sm" onClick={() => zoom(1)}>Zoom in</button><button className="rounded-full bg-white/10 px-3 py-1 text-sm" onClick={() => zoom(-1)}>Zoom out</button></div><svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className="h-full min-h-[540px] w-full rounded-[1.5rem] bg-slate-950/80"><defs><linearGradient id="floor" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#111827" /><stop offset="1" stopColor="#020617" /></linearGradient></defs><rect x="40" y="40" width="740" height="560" rx="42" fill="url(#floor)" stroke="rgba(148,163,184,.25)" /><path d="M90 350 H730 M410 80 V560 M90 210 H360 M470 210 H730" stroke="rgba(148,163,184,.18)" strokeWidth="8" strokeLinecap="round" /><path d="M110 110 C240 70 360 90 500 130 S680 140 720 100" stroke="rgba(34,211,238,.18)" strokeWidth="20" fill="none" />{spaces.map((space) => <SpaceMarker key={space.id} space={space} state={markerState(space)} onSelect={onSelectSpace} />)}</svg></section>;
}
