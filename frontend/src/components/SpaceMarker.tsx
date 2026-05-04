import type { Space } from '../types';

interface Props { space: Space; state: 'available' | 'booked' | 'recommended' | 'selected'; onSelect: (space: Space) => void }
const stateClass = { available: 'fill-cyan-300 stroke-cyan-100 drop-shadow-[0_0_14px_rgba(34,211,238,0.7)]', booked: 'fill-rose-500/70 stroke-rose-200 opacity-60', recommended: 'fill-emerald-300 stroke-white drop-shadow-[0_0_20px_rgba(16,185,129,0.9)]', selected: 'fill-amber-300 stroke-white drop-shadow-[0_0_22px_rgba(251,191,36,0.9)]' };
export default function SpaceMarker({ space, state, onSelect }: Props) {
  const radius = state === 'selected' ? 15 : state === 'recommended' ? 13 : space.type === 'meeting_room' ? 12 : 9;
  return <g data-testid="space-marker" role="button" tabIndex={0} aria-label={space.name} onClick={() => onSelect(space)} onKeyDown={(event) => event.key === 'Enter' && onSelect(space)} className="cursor-pointer transition-transform hover:scale-110"><circle cx={space.x_coordinate} cy={space.y_coordinate} r={radius + 9} className="fill-white/5" /><circle cx={space.x_coordinate} cy={space.y_coordinate} r={radius} className={`${stateClass[state]} stroke-2 transition-all`} /><title>{`${space.name} - ${space.zone} - capacity ${space.capacity}`}</title></g>;
}
