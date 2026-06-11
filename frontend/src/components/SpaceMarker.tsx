import type { Space } from '../types';

export type SpaceMarkerState = 'available' | 'booked' | 'mine' | 'selected';

interface Props {
  space: Space;
  state: SpaceMarkerState;
  isRecommended?: boolean;
  onSelect: (space: Space) => void;
  x: number;
  y: number;
}

const stateStyles = {
  available: {
    top: 'rgba(48, 209, 88, 0.92)',
    side: 'rgba(20, 120, 54, 0.72)',
    stroke: 'rgba(226, 255, 235, 0.98)',
    glow: 'rgba(48, 209, 88, 0.42)',
  },
  booked: {
    top: 'rgba(255, 69, 58, 0.92)',
    side: 'rgba(126, 32, 29, 0.72)',
    stroke: 'rgba(255, 220, 216, 0.98)',
    glow: 'rgba(255, 69, 58, 0.38)',
  },
  mine: {
    top: 'rgba(191, 90, 242, 0.94)',
    side: 'rgba(98, 28, 168, 0.72)',
    stroke: 'rgba(245, 235, 255, 0.98)',
    glow: 'rgba(191, 90, 242, 0.46)',
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

export default function SpaceMarker({ space, state, isRecommended = false, onSelect, x, y }: Props) {
  const style = stateStyles[state];
  const isDesk = space.type === 'hot_desk';
  const width = isDesk ? 28 : 36;
  const depth = isDesk ? 19 : 24;
  const height = isDesk ? 11 : 15;
  const deskPad = isDesk ? 9 : 12;
  const deskRectW = isDesk ? 18 : 24;
  const deskRectH = isDesk ? 7 : 10;
  const chairR = isDesk ? 2.75 : 3.5;
  const chairY = isDesk ? 6 : 8;
  const selectedLift = state === 'selected' ? -4 : state === 'mine' ? -2 : 0;
  const label = `${space.name} - ${space.zone} - capacity ${space.capacity}`;

  return (
    <g
      data-testid="space-marker"
      data-marker-state={state}
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
    >
      <g className="dashboard-space-marker-body" transform={`translate(0 ${selectedLift})`}>
        <title>{label}</title>
        <ellipse cx={x} cy={y + depth / 2 + 12} rx={width / 1.7} ry={depth / 1.9} fill={style.glow} opacity={0.5} filter="url(#softBlur)" />
        {state === 'selected' ? (
          <ellipse
            cx={x}
            cy={y + 3}
            rx={width / 1.35}
            ry={depth / 1.25}
            fill="none"
            stroke={style.glow}
            strokeWidth="2.5"
            className="dashboard-space-marker-pulse"
          />
        ) : null}
        {isRecommended && state === 'available' ? (
          <ellipse
            cx={x}
            cy={y + 3}
            rx={width / 1.45}
            ry={depth / 1.35}
            fill="none"
            stroke="rgba(126, 200, 255, 0.95)"
            strokeWidth="2"
            className="dashboard-space-marker-pulse"
          />
        ) : null}
        <polygon points={diamondPoints(x, y + height, width, depth)} fill={style.side} opacity={0.9} />
        <polygon points={diamondPoints(x, y, width, depth)} fill={style.top} stroke={style.stroke} strokeWidth={state === 'selected' ? 2.2 : 1.35} />
        <rect x={x - deskPad} y={y - 4} width={deskRectW} height={deskRectH} rx="2.5" fill="rgba(255,255,255,0.78)" transform={`rotate(0 ${x} ${y})`} />
        <circle cx={x} cy={y + chairY} r={chairR} fill="rgba(255,255,255,0.4)" />
        {!isDesk ? (
          <text x={x} y={y + depth / 2 + 22} textAnchor="middle" className="dashboard-space-label" opacity={0.9}>
            {space.name}
          </text>
        ) : null}
      </g>
    </g>
  );
}
