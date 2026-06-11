import { type PointerEvent, type WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MapPinned, Minus, Plus } from 'lucide-react';
import type { FloorLayoutExportV1, Space } from '../types';
import { placementCenterPx } from '../lib/floorLayoutCoords';
import SpaceMarker from './SpaceMarker';

interface Props {
  spaces: Space[];
  selectedSpace?: Space | null;
  recommendedSpaceIds?: number[];
  bookedSpaceIds?: number[];
  myBookedSpaceIds?: number[];
  onSelectSpace: (space: Space) => void;
  floorId?: number;
  /** When set, renders background image + markers from layout; match placements via `space.layoutLocalId ?? space.id`. */
  layout?: FloorLayoutExportV1 | null;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const floorShapes: Record<'manchester' | 'london', { title: string; width: number; height: number; viewBox: ViewBox; transform?: string }> = {
  manchester: {
    title: 'Manchester office',
    width: 1024,
    height: 820,
    viewBox: { x: -95, y: -90, width: 1210, height: 910 },
    transform: 'translate(250 38) rotate(-3 512 410) skewX(-7) scale(0.78 0.76)',
  },
  london: {
    title: 'London office',
    width: 1024,
    height: 760,
    viewBox: { x: -70, y: -70, width: 1160, height: 860 },
  },
};

function getFloorShape(floorId?: number) {
  return floorId === 3 ? floorShapes.london : floorShapes.manchester;
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
        className="floor-extrude"
        d="M74 76 L304 34 L430 506 L372 522 L418 704 L164 744 L58 96 Z M406 238 H676 V356 H526 V400 H414 Z M670 70 H948 V334 H816 V705 H662 V446 H530 V388 H672 Z"
        transform="translate(26 34)"
      />
      <path
        className="floor-shell"
        d="M74 76 L304 34 L430 506 L372 522 L418 704 L164 744 L58 96 Z M406 238 H676 V356 H526 V400 H414 Z M670 70 H948 V334 H816 V705 H662 V446 H530 V388 H672 Z"
      />
      <path className="floor-corridor" d="M402 238 H676 V354 H523 V398 H414 Z" />
      <path className="floor-corridor" d="M382 454 L662 448 V570 L532 570 V514 L412 530 Z" />
      <path className="floor-corridor" d="M520 570 H664 V705 H418 L386 590 H520 Z" />

      <MeetingRoom x={106} y={88} width={138} height={84} rotate={-10} seats={10} />
      <MeetingRoom x={196} y={632} width={154} height={84} rotate={-10} seats={12} />
      <MeetingRoom x={688} y={86} width={116} height={80} seats={8} />
      <MeetingRoom x={826} y={356} width={98} height={106} seats={10} />
      <MeetingRoom x={828} y={654} width={98} height={50} seats={6} />

      <rect x="498" y="466" width="138" height="100" rx="10" className="floor-service" />
      <rect x="602" y="610" width="132" height="78" rx="9" className="floor-service" />
      <rect x="348" y="502" width="80" height="58" rx="8" className="floor-room" transform="rotate(-10 388 531)" />
      <rect x="734" y="494" width="74" height="78" rx="8" className="floor-room" />

      <DeskCluster x={126} y={204} cols={4} rotate={-10} />
      <DeskCluster x={164} y={320} cols={4} rotate={-10} />
      <DeskCluster x={198} y={432} cols={4} rotate={-10} />
      <DeskCluster x={232} y={532} cols={4} rotate={-10} />
      <DeskCluster x={256} y={610} rows={1} cols={4} rotate={-10} />
      <DeskCluster x={286} y={156} rows={2} cols={3} rotate={-10} />
      <DeskCluster x={318} y={300} rows={2} cols={3} rotate={-10} />

      <DeskCluster x={706} y={184} cols={4} />
      <DeskCluster x={828} y={184} cols={4} />
      <DeskCluster x={708} y={286} cols={4} />
      <DeskCluster x={830} y={286} cols={4} />
      <DeskCluster x={836} y={492} cols={4} />
      <DeskCluster x={832} y={574} rows={1} cols={4} />
      <DeskCluster x={672} y={638} rows={2} cols={3} />
      <DeskCluster x={746} y={638} rows={2} cols={3} />
      <DeskCluster x={604} y={406} rows={1} cols={4} />
      <DeskCluster x={730} y={440} rows={2} cols={2} />

      <path className="floor-internal-wall" d="M304 34 L340 168 M358 236 L404 410 M372 522 L418 704 M670 70 H948 M670 334 H948 M816 334 V705 M662 446 H816 M498 466 H734 M498 566 H636" />
      <path className="floor-window" d="M86 84 L122 244 M134 300 L184 508 M194 570 L236 724" />
      <path className="floor-window" d="M948 92 V324 M948 494 V690 M674 70 H936 M664 706 H806" />
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
  myBookedSpaceIds = [],
  onSelectSpace,
  floorId,
  layout = null,
}: Props) {
  const builtInShape = useMemo(() => getFloorShape(floorId ?? spaces[0]?.floor_id), [floorId, spaces]);

  const shape = useMemo(() => {
    if (layout) {
      const { w, h } = layout.referenceSize;
      return {
        title: layout.title ?? 'Custom floor',
        width: w,
        height: h,
        viewBox: { x: 0, y: 0, width: w, height: h } satisfies ViewBox,
        transform: undefined as string | undefined,
      };
    }
    return builtInShape;
  }, [layout, builtInShape]);

  const [viewBox, setViewBox] = useState(shape.viewBox);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; viewBox: ViewBox } | null>(null);
  const recommended = useMemo(() => new Set(recommendedSpaceIds), [recommendedSpaceIds]);
  const booked = useMemo(() => new Set(bookedSpaceIds), [bookedSpaceIds]);
  const mine = useMemo(() => new Set(myBookedSpaceIds), [myBookedSpaceIds]);

  useEffect(() => {
    setViewBox(shape.viewBox);
  }, [shape.viewBox]);

  const projectedSpaces = useMemo(() => {
    if (!layout) {
      return spaces.map((space) => ({ space, x: space.x_coordinate, y: space.y_coordinate }));
    }
    const { w, h } = layout.referenceSize;
    const list: { space: Space; x: number; y: number }[] = [];
    for (const space of spaces) {
      const layoutKey = space.layoutLocalId ?? space.id;
      const p = layout.placements.find((pl) => pl.localId === layoutKey);
      if (!p) continue;
      list.push({ space, ...placementCenterPx(p, w, h) });
    }
    return list;
  }, [spaces, layout]);

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
    if (mine.has(space.id)) return 'mine' as const;
    if (booked.has(space.id)) return 'booked' as const;
    return 'available' as const;
  }

  function isRecommended(space: Space) {
    return recommended.has(space.id);
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

        {layout ? (
          <>
            <rect x="-2000" y="-2000" width="8000" height="8000" fill="rgba(1, 3, 23, 1)" />
            <image
              href={layout.background.value}
              x={0}
              y={0}
              width={shape.width}
              height={shape.height}
              preserveAspectRatio="none"
            />
            {projectedSpaces.map(({ space, x, y }) => (
              <SpaceMarker
                key={space.id}
                space={space}
                x={x}
                y={y}
                state={markerState(space)}
                isRecommended={isRecommended(space)}
                onSelect={onSelectSpace}
              />
            ))}
          </>
        ) : (
          <>
            <rect x="-4000" y="-4000" width="10000" height="10000" fill="url(#isoGrid)" />

            <ellipse cx={shape.width / 2} cy={shape.height * 0.82} rx="720" ry="220" fill="rgba(0, 122, 255, 0.12)" filter="url(#softBlur)" />
            <ellipse cx={shape.width / 2} cy={shape.height * 0.78} rx="520" ry="150" fill="rgba(0, 0, 0, 0.42)" filter="url(#softBlur)" />

            <g transform={shape.transform}>
              {floorId === 3 ? <LondonFloorArt /> : <ManchesterFloorArt />}
              {projectedSpaces.map(({ space, x, y }) => (
                <SpaceMarker
                  key={space.id}
                  space={space}
                  x={x}
                  y={y}
                  state={markerState(space)}
                  isRecommended={isRecommended(space)}
                  onSelect={onSelectSpace}
                />
              ))}
            </g>
          </>
        )}
      </svg>
    </section>
  );
}
