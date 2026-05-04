import { type PointerEvent, type WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MapPinned, Minus, Plus } from 'lucide-react';
import type { Space } from '../types';
import SpaceMarker from './SpaceMarker';

interface Props {
  spaces: Space[];
  selectedSpace?: Space | null;
  recommendedSpaceIds?: number[];
  bookedSpaceIds?: number[];
  onSelectSpace: (space: Space) => void;
  floorId?: number;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const floorShapes: Record<'manchester' | 'london', { title: string; width: number; height: number; viewBox: ViewBox }> = {
  manchester: {
    title: 'Manchester office',
    width: 1024,
    height: 780,
    viewBox: { x: -70, y: -70, width: 1160, height: 880 },
  },
  london: {
    title: 'London office',
    width: 1024,
    height: 760,
    viewBox: { x: -70, y: -70, width: 1160, height: 860 },
  },
};

function getFloorShape(floorId?: number) {
  return floorId === 2 ? floorShapes.london : floorShapes.manchester;
}

function DeskCluster({ x, y, rows = 2, cols = 4, rotate = 0 }: { x: number; y: number; rows?: number; cols?: number; rotate?: number }) {
  const desks = Array.from({ length: rows * cols });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-8" y="-8" width={cols * 34 + 16} height={rows * 30 + 16} rx="10" className="floor-zone-soft" />
      {desks.map((_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return (
          <g key={index} transform={`translate(${col * 34} ${row * 30})`}>
            <rect x="0" y="0" width="24" height="12" rx="3" className="floor-desk" />
            <circle cx="12" cy="22" r="4" className="floor-chair" />
          </g>
        );
      })}
    </g>
  );
}

function MeetingRoom({ x, y, width, height, rotate = 0, seats = 8 }: { x: number; y: number; width: number; height: number; rotate?: number; seats?: number }) {
  const seatItems = Array.from({ length: seats });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="0" y="0" width={width} height={height} rx="8" className="floor-room" />
      <rect x={width * 0.22} y={height * 0.34} width={width * 0.56} height={height * 0.22} rx="5" className="floor-table" />
      {seatItems.map((_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const offset = Math.floor(index / 2);
        return (
          <circle
            key={index}
            cx={width * 0.27 + offset * ((width * 0.46) / Math.max(1, seats / 2 - 1))}
            cy={height * 0.45 + side * height * 0.22}
            r="4"
            className="floor-chair"
          />
        );
      })}
    </g>
  );
}

function ManchesterFloorArt() {
  return (
    <g className="floor-art">
      <path
        className="floor-shell"
        d="M74 78 L304 34 L404 488 L342 506 L382 712 L138 744 Z M656 70 H930 V332 H810 V700 H660 V446 H528 V360 H656 Z M362 244 H660 V394 H378 Z"
      />
      <path className="floor-corridor" d="M352 244 H660 V392 H378 Z" />
      <path className="floor-corridor" d="M386 484 H660 V620 H432 Z" />
      <MeetingRoom x={116} y={82} width={128} height={88} rotate={-10} seats={10} />
      <MeetingRoom x={174} y={628} width={150} height={86} rotate={-10} seats={12} />
      <MeetingRoom x={710} y={82} width={116} height={82} seats={8} />
      <MeetingRoom x={812} y={360} width={100} height={110} seats={10} />
      <rect x="490" y="468" width="120" height="118" rx="9" className="floor-service" />
      <rect x="604" y="616" width="112" height="66" rx="8" className="floor-service" />
      <DeskCluster x={132} y={204} cols={4} rotate={-10} />
      <DeskCluster x={176} y={334} cols={4} rotate={-10} />
      <DeskCluster x={218} y={466} cols={4} rotate={-10} />
      <DeskCluster x={252} y={570} cols={4} rotate={-10} />
      <DeskCluster x={694} y={188} cols={4} />
      <DeskCluster x={816} y={188} cols={4} />
      <DeskCluster x={696} y={296} cols={4} />
      <DeskCluster x={824} y={548} cols={4} />
      <DeskCluster x={610} y={404} rows={1} cols={3} />
      <DeskCluster x={666} y={640} rows={2} cols={3} />
      <path className="floor-window" d="M98 86 L132 252 M142 310 L186 510 M192 572 L224 720" />
      <path className="floor-window" d="M930 90 V320 M930 548 V694 M656 70 H920" />
    </g>
  );
}

function LondonFloorArt() {
  return (
    <g className="floor-art">
      <path
        className="floor-shell"
        d="M90 568 L386 492 L612 432 L686 308 L696 72 H934 V532 L742 620 L410 676 L120 724 Z"
      />
      <path className="floor-corridor" d="M104 548 L610 420 L680 304 L686 232 L386 492 L90 568 Z" />
      <rect x="694" y="80" width="226" height="142" rx="10" className="floor-zone-soft" />
      <rect x="682" y="226" width="242" height="300" rx="12" className="floor-zone-soft" />
      <rect x="190" y="522" width="410" height="112" rx="12" className="floor-zone-soft" transform="rotate(-12 395 578)" />
      <MeetingRoom x={132} y={620} width={116} height={72} rotate={-12} seats={8} />
      <MeetingRoom x={442} y={548} width={106} height={70} rotate={-12} seats={8} />
      <MeetingRoom x={754} y={384} width={130} height={108} seats={12} />
      <MeetingRoom x={764} y={98} width={100} height={72} seats={6} />
      <DeskCluster x={244} y={574} rows={2} cols={3} rotate={-12} />
      <DeskCluster x={332} y={544} rows={2} cols={3} rotate={-12} />
      <DeskCluster x={500} y={534} rows={1} cols={3} rotate={-12} />
      <DeskCluster x={712} y={248} rows={2} cols={3} />
      <DeskCluster x={816} y={286} rows={2} cols={3} />
      <DeskCluster x={794} y={186} rows={1} cols={3} />
      <DeskCluster x={722} y={470} rows={1} cols={4} />
      <path className="floor-window" d="M116 570 L392 502 M608 432 L684 302 M700 74 H928 M934 92 V520" />
      <circle cx="636" cy="390" r="34" className="floor-service" />
      <rect x="360" y="460" width="82" height="46" rx="8" className="floor-service" transform="rotate(-12 401 483)" />
    </g>
  );
}

export default function FloorPlan({
  spaces,
  selectedSpace,
  recommendedSpaceIds = [],
  bookedSpaceIds = [],
  onSelectSpace,
  floorId,
}: Props) {
  const shape = getFloorShape(floorId ?? spaces[0]?.floor_id);
  const [viewBox, setViewBox] = useState(shape.viewBox);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; viewBox: ViewBox } | null>(null);
  const recommended = useMemo(() => new Set(recommendedSpaceIds), [recommendedSpaceIds]);
  const booked = useMemo(() => new Set(bookedSpaceIds), [bookedSpaceIds]);

  useEffect(() => {
    setViewBox(shape.viewBox);
  }, [shape.viewBox]);

  const projectedSpaces = useMemo(
    () => spaces.map((space) => ({ space, x: space.x_coordinate, y: space.y_coordinate })),
    [spaces],
  );

  function zoom(delta: number, center?: { x: number; y: number }) {
    setViewBox((box) => {
      const factor = delta > 0 ? 0.88 : 1.12;
      const width = Math.min(shape.viewBox.width * 1.18, Math.max(330, box.width * factor));
      const height = Math.min(shape.viewBox.height * 1.18, Math.max(250, box.height * factor));
      const anchor = center ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const nextX = anchor.x - ((anchor.x - box.x) / box.width) * width;
      const nextY = anchor.y - ((anchor.y - box.y) / box.height) * height;
      return { x: nextX, y: nextY, width, height };
    });
  }

  function clientToSvg(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
      y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
    };
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, viewBox };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.pointerId !== event.pointerId) return;
    const dx = ((event.clientX - drag.clientX) / rect.width) * drag.viewBox.width;
    const dy = ((event.clientY - drag.clientY) / rect.height) * drag.viewBox.height;
    setViewBox({ ...drag.viewBox, x: drag.viewBox.x - dx, y: drag.viewBox.y - dy });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const center = clientToSvg(event.clientX, event.clientY);
    zoom(event.deltaY < 0 ? 1 : -1, center ?? undefined);
  }

  function markerState(space: Space) {
    if (selectedSpace?.id === space.id) return 'selected' as const;
    if (recommended.has(space.id)) return 'recommended' as const;
    if (booked.has(space.id)) return 'booked' as const;
    return 'available' as const;
  }

  return (
    <section
      className="dashboard-floor-map"
      aria-label="Interactive office floor plan"
    >
      <div className="dashboard-map-caption">
        <div>
          <MapPinned size={16} aria-hidden />
          <div>
            <p>{shape.title}</p>
            <span>{spaces.length} visible spaces</span>
          </div>
        </div>
      </div>

      <div className="dashboard-map-controls">
        <button
          type="button"
          className="dashboard-icon-button"
          onClick={() => zoom(1)}
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          className="dashboard-icon-button"
          onClick={() => zoom(-1)}
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="dashboard-floor-svg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <filter id="softBlur">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="subtleBlur">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <linearGradient id="floorTop" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="rgba(82, 177, 255, 0.28)" />
            <stop offset="1" stopColor="rgba(6, 18, 38, 0.18)" />
          </linearGradient>
          <linearGradient id="platformFront" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="rgba(0, 122, 255, 0.18)" />
            <stop offset="1" stopColor="rgba(10, 13, 20, 0)" />
          </linearGradient>

          <pattern id="isoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0"  x2="60" y2="30" stroke="rgba(92, 182, 255, 0.08)" strokeWidth="0.75" />
            <line x1="0" y1="30" x2="60" y2="60" stroke="rgba(92, 182, 255, 0.08)" strokeWidth="0.75" />
            <line x1="0" y1="30" x2="60" y2="0"  stroke="rgba(255, 149, 0, 0.055)" strokeWidth="0.75" />
            <line x1="0" y1="60" x2="60" y2="30" stroke="rgba(255, 149, 0, 0.055)" strokeWidth="0.75" />
          </pattern>
        </defs>

        <rect x="-4000" y="-4000" width="10000" height="10000" fill="url(#isoGrid)" />

        <ellipse cx={shape.width / 2} cy={shape.height * 0.82} rx="720" ry="220" fill="rgba(0, 122, 255, 0.12)" filter="url(#softBlur)" />
        <ellipse cx={shape.width / 2} cy={shape.height * 0.78} rx="520" ry="150" fill="rgba(0, 0, 0, 0.42)" filter="url(#softBlur)" />

        <g>
          {floorId === 2 ? <LondonFloorArt /> : <ManchesterFloorArt />}
          {projectedSpaces.map(({ space, x, y }) => (
            <SpaceMarker
              key={space.id}
              space={space}
              x={x}
              y={y}
              state={markerState(space)}
              onSelect={onSelectSpace}
            />
          ))}
        </g>
      </svg>
    </section>
  );
}
