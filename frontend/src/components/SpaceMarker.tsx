import type { Space } from '../types';

interface Props {
  space: Space;
  state: 'available' | 'booked' | 'recommended' | 'selected';
  onSelect: (space: Space) => void;
  x: number;
  y: number;
}

const stateStyles = {
  available: {
    top: 'rgba(48, 209, 88, 0.86)',
    side: 'rgba(20, 120, 54, 0.62)',
    stroke: 'rgba(226, 255, 235, 0.95)',
    glow: 'rgba(48, 209, 88, 0.36)',
  },
  booked: {
    top: 'rgba(255, 69, 58, 0.44)',
    side: 'rgba(126, 32, 29, 0.5)',
    stroke: 'rgba(255, 202, 198, 0.72)',
    glow: 'rgba(255, 69, 58, 0.2)',
  },
  recommended: {
    top: 'rgba(255, 159, 10, 0.92)',
    side: 'rgba(154, 91, 4, 0.62)',
    stroke: 'rgba(255, 246, 226, 0.98)',
    glow: 'rgba(255, 159, 10, 0.46)',
  },
  selected: {
    top: 'rgba(10, 132, 255, 0.96)',
    side: 'rgba(0, 73, 164, 0.68)',
    stroke: 'rgba(255, 255, 255, 0.96)',
    glow: 'rgba(10, 132, 255, 0.55)',
  },
};

function diamondPoints(x: number, y: number, width: number, depth: number) {
  return `${x},${y - depth / 2} ${x + width / 2},${y} ${x},${y + depth / 2} ${x - width / 2},${y}`;
}

export default function SpaceMarker({ space, state, onSelect, x, y }: Props) {
  const style = stateStyles[state];
  const isRoom = space.type === 'meeting_room';
  const width = isRoom ? 84 + Math.min(space.capacity, 12) * 2 : 38;
  const depth = isRoom ? 52 + Math.min(space.capacity, 12) : 26;
  const height = isRoom ? 26 : 16;
  const selectedLift = state === 'selected' ? -10 : state === 'recommended' ? -5 : 0;
  const label = `${space.name} - ${space.zone} - capacity ${space.capacity}`;

  return (
    <g
      data-testid="space-marker"
      role="button"
      tabIndex={0}
      focusable="true"
      aria-label={space.name}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => onSelect(space)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(space);
        }
      }}
      className="dashboard-space-marker"
      transform={`translate(0 ${selectedLift})`}
    >
      <title>{label}</title>
      <ellipse cx={x} cy={y + depth / 2 + 15} rx={width / 1.7} ry={depth / 1.9} fill={style.glow} opacity={state === 'booked' ? 0.24 : 0.5} filter="url(#softBlur)" />
      {state === 'selected' ? <ellipse cx={x} cy={y + 4} rx={width / 1.35} ry={depth / 1.25} fill="none" stroke={style.glow} strokeWidth="3" opacity="0.6" style={{ animation: 'mapPulse 1.8s ease-in-out infinite', transformOrigin: `${x}px ${y}px` }} /> : null}
      {state === 'recommended' ? <ellipse cx={x} cy={y + 4} rx={width / 1.45} ry={depth / 1.35} fill="none" stroke={style.stroke} strokeWidth="2.5" opacity="0.7" style={{ animation: 'mapPulse 1.8s ease-in-out infinite', transformOrigin: `${x}px ${y}px` }} /> : null}
      <polygon points={diamondPoints(x, y + height, width, depth)} fill={style.side} opacity={state === 'booked' ? 0.54 : 0.9} />
      <polygon points={diamondPoints(x, y, width, depth)} fill={style.top} stroke={style.stroke} strokeWidth={state === 'selected' ? 2.5 : 1.5} opacity={state === 'booked' ? 0.62 : 1} />
      {isRoom ? (
        <>
          <polyline points={`${x - width / 2},${y} ${x},${y - depth / 2} ${x + width / 2},${y}`} fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="2" />
          <line x1={x} y1={y - depth / 2} x2={x} y2={y + depth / 2} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <rect x={x - 12} y={y - 5} width="24" height="10" rx="3" fill="rgba(255,255,255,0.78)" transform={`rotate(0 ${x} ${y})`} />
          <circle cx={x} cy={y + 8} r="4" fill="rgba(255,255,255,0.4)" />
        </>
      )}
      <text x={x} y={y + depth / 2 + 28} textAnchor="middle" className="dashboard-space-label" opacity={state === 'booked' ? 0.48 : 0.9}>
        {space.name}
      </text>
    </g>
  );
}
