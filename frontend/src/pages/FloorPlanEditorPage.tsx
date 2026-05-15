import { type MouseEvent, type PointerEvent as ReactPointerEvent, useCallback, useId, useMemo, useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import type { FloorLayoutExportV1, FloorLayoutFloorMeta, PlacementV1, SpaceType } from '../types';
import { clamp01, placementCenterPx } from '../lib/floorLayoutCoords';

const SCHEMA = 'meetmi-floor-layout-v1' as const;
/** Normalized bbox for export / layout math; drawn as a circle in the editor (same footprint as desks). */
const DEFAULT_ROOM_NW = 0.036;
const DEFAULT_ROOM_NH = 0.036;
const MARKER_RADIUS_PX = 14;

function nextLocalId(placements: PlacementV1[]): number {
  const max = placements.reduce((m, p) => Math.max(m, p.localId), 0);
  return max + 1;
}

/** Maps screen pixels to SVG user space (handles letterboxing from preserveAspectRatio). */
function clientToSvgUser(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const mapped = pt.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

function clientToNorm(svg: SVGSVGElement, clientX: number, clientY: number, refW: number, refH: number) {
  const p = clientToSvgUser(svg, clientX, clientY);
  if (!p) return { nx: 0, ny: 0 };
  return { nx: clamp01(p.x / refW), ny: clamp01(p.y / refH) };
}

export default function FloorPlanEditorPage() {
  const inputId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: number; startSvg: { x: number; y: number }; startPlacement: PlacementV1 } | null>(null);

  const [background, setBackground] = useState<{ kind: 'dataUrl'; value: string } | null>(null);
  const [refSize, setRefSize] = useState<{ w: number; h: number } | null>(null);
  const [title, setTitle] = useState('Untitled floor');
  const [floorMetaId, setFloorMetaId] = useState(4);
  const [floorMetaName, setFloorMetaName] = useState('New floor');
  const [floorMetaNumber, setFloorMetaNumber] = useState(4);
  const [tool, setTool] = useState<SpaceType>('hot_desk');
  const [placements, setPlacements] = useState<PlacementV1[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const refW = refSize?.w ?? 1;
  const refH = refSize?.h ?? 1;

  const selected = useMemo(() => placements.find((p) => p.localId === selectedId) ?? null, [placements, selectedId]);

  const onFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? '');
      const img = new Image();
      img.onload = () => {
        setBackground({ kind: 'dataUrl', value });
        setRefSize({ w: img.naturalWidth, h: img.naturalHeight });
        setPlacements([]);
        setSelectedId(null);
      };
      img.src = value;
    };
    reader.readAsDataURL(file);
  }, []);

  function handleStageClick(event: MouseEvent<SVGRectElement>) {
    if (!svgRef.current || !refSize || !background) return;
    const { nx, ny } = clientToNorm(svgRef.current, event.clientX, event.clientY, refW, refH);
    const localId = nextLocalId(placements);
    if (tool === 'hot_desk') {
      setPlacements((prev) => [...prev, { localId, kind: 'hot_desk', nx, ny, name: `Desk ${localId}`, zone: 'Zone', capacity: 1 }]);
    } else {
      const nw = DEFAULT_ROOM_NW;
      const nh = DEFAULT_ROOM_NH;
      setPlacements((prev) => [
        ...prev,
        {
          localId,
          kind: 'meeting_room',
          nx: clamp01(nx - nw / 2),
          ny: clamp01(ny - nh / 2),
          nw,
          nh,
          name: `Room ${localId}`,
          zone: 'Zone',
          capacity: 6,
        },
      ]);
    }
    setSelectedId(localId);
  }

  function handleMarkerPointerDown(event: ReactPointerEvent<SVGElement>, p: PlacementV1) {
    event.stopPropagation();
    event.preventDefault();
    if (!svgRef.current) return;
    const startSvg = clientToSvgUser(svgRef.current, event.clientX, event.clientY);
    if (!startSvg) return;
    setSelectedId(p.localId);
    dragRef.current = { id: p.localId, startSvg, startPlacement: { ...p } };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMarkerPointerMove(event: ReactPointerEvent<SVGElement>) {
    const drag = dragRef.current;
    if (!drag || !svgRef.current || !refSize) return;
    const cur = clientToSvgUser(svgRef.current, event.clientX, event.clientY);
    if (!cur) return;
    const dux = cur.x - drag.startSvg.x;
    const duy = cur.y - drag.startSvg.y;
    const start = drag.startPlacement;

    setPlacements((prev) =>
      prev.map((pl) => {
        if (pl.localId !== drag.id) return pl;
        if (pl.kind === 'meeting_room' && start.nw != null && start.nh != null) {
          const cx0 = (start.nx + start.nw / 2) * refW;
          const cy0 = (start.ny + start.nh / 2) * refH;
          const cx = cx0 + dux;
          const cy = cy0 + duy;
          let nx = cx / refW - start.nw / 2;
          let ny = cy / refH - start.nh / 2;
          nx = Math.min(1 - start.nw, Math.max(0, nx));
          ny = Math.min(1 - start.nh, Math.max(0, ny));
          return { ...pl, nx, ny, nw: start.nw, nh: start.nh };
        }
        return {
          ...pl,
          nx: clamp01(start.nx + dux / refW),
          ny: clamp01(start.ny + duy / refH),
        };
      }),
    );
  }

  function handleMarkerPointerUp(event: ReactPointerEvent<SVGElement>) {
    if (dragRef.current) {
      dragRef.current = null;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  function updateSelected(patch: Partial<PlacementV1>) {
    if (selectedId == null) return;
    setPlacements((prev) => prev.map((p) => (p.localId === selectedId ? { ...p, ...patch } : p)));
  }

  function removeSelected() {
    if (selectedId == null) return;
    setPlacements((prev) => prev.filter((p) => p.localId !== selectedId));
    setSelectedId(null);
  }

  function exportJson() {
    if (!background || !refSize) return;
    const floorMeta: FloorLayoutFloorMeta = {
      id: Math.max(1, Math.floor(floorMetaId)),
      name: floorMetaName.trim() || title.trim() || 'Imported floor',
      floor_number: Math.max(1, Math.floor(floorMetaNumber)),
    };
    const payload: FloorLayoutExportV1 = {
      version: 1,
      schema: SCHEMA,
      title,
      floorMeta,
      referenceSize: { w: refSize.w, h: refSize.h },
      background,
      placements,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase() || 'floor-layout'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="floor-editor-page">
      <header className="floor-editor-header surface-panel">
        <div>
          <h1 className="floor-editor-title">Floor plan editor</h1>
          <p className="floor-editor-sub">
            Dev-only: upload an image, place desks or rooms, export JSON. Save under <code className="floor-editor-code">src/data/floorLayouts/</code> with{' '}
            <code className="floor-editor-code">floorMeta</code> set (below) — the app picks up registry + demo spaces automatically. Marker{' '}
            <code className="floor-editor-code">localId</code> maps to layout geometry; booking uses a separate unique <code className="floor-editor-code">Space.id</code> when needed (
            <code className="floor-editor-code">layoutLocalId</code> in demo).
          </p>
        </div>
        <div className="floor-editor-header-actions">
          <label htmlFor={inputId} className="floor-editor-btn floor-editor-btn-secondary">
            <Upload size={16} aria-hidden />
            Upload image
          </label>
          <input id={inputId} className="sr-only" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <button type="button" className="floor-editor-btn floor-editor-btn-primary" disabled={!background} onClick={exportJson}>
            <Download size={16} aria-hidden />
            Export JSON
          </button>
        </div>
      </header>

      <div className="floor-editor-body">
        <aside className="floor-editor-sidebar surface-panel">
          <label className="floor-editor-label">
            Floor title
            <input className="floor-editor-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <p className="floor-editor-label">Auto-wiring (written into JSON as floorMeta)</p>
          <label className="floor-editor-label">
            Dashboard floor id
            <input
              className="floor-editor-input"
              type="number"
              min={1}
              step={1}
              value={floorMetaId}
              onChange={(e) => setFloorMetaId(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label className="floor-editor-label">
            Office list name
            <input className="floor-editor-input" value={floorMetaName} onChange={(e) => setFloorMetaName(e.target.value)} />
          </label>
          <label className="floor-editor-label">
            Floor number (label)
            <input
              className="floor-editor-input"
              type="number"
              min={1}
              step={1}
              value={floorMetaNumber}
              onChange={(e) => setFloorMetaNumber(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <p className="floor-editor-label">Tool</p>
          <div className="floor-editor-segment">
            <button type="button" className={tool === 'hot_desk' ? 'is-active' : ''} onClick={() => setTool('hot_desk')}>
              Hot desk
            </button>
            <button type="button" className={tool === 'meeting_room' ? 'is-active' : ''} onClick={() => setTool('meeting_room')}>
              Meeting room
            </button>
          </div>

          {selected ? (
            <div className="floor-editor-form">
              <p className="floor-editor-label">Placement #{selected.localId}</p>
              <label className="floor-editor-label">
                Name
                <input className="floor-editor-input" value={selected.name ?? ''} onChange={(e) => updateSelected({ name: e.target.value })} />
              </label>
              <label className="floor-editor-label">
                Zone
                <input className="floor-editor-input" value={selected.zone ?? ''} onChange={(e) => updateSelected({ zone: e.target.value })} />
              </label>
              <label className="floor-editor-label">
                Capacity
                <input
                  className="floor-editor-input"
                  type="number"
                  min={1}
                  value={selected.capacity ?? 1}
                  onChange={(e) => updateSelected({ capacity: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
              <button type="button" className="floor-editor-btn floor-editor-btn-danger" onClick={removeSelected}>
                <Trash2 size={16} aria-hidden />
                Remove
              </button>
            </div>
          ) : (
            <p className="floor-editor-hint">Click the map to add a {tool === 'hot_desk' ? 'desk' : 'meeting room'} at the cursor (orange = room, green = desk).</p>
          )}

          <div className="floor-editor-list">
            <p className="floor-editor-label">Placements ({placements.length})</p>
            <ul>
              {placements.map((p) => (
                <li key={p.localId}>
                  <button type="button" className={p.localId === selectedId ? 'is-active' : ''} onClick={() => setSelectedId(p.localId)}>
                    #{p.localId} — {p.kind === 'hot_desk' ? 'Desk' : 'Room'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="floor-editor-stage-wrap surface-panel">
          {!background || !refSize ? (
            <div className="floor-editor-empty">Upload a floor plan image to begin.</div>
          ) : (
            <svg
              ref={svgRef}
              role="img"
              aria-label="Floor plan authoring canvas"
              className="floor-editor-svg"
              viewBox={`0 0 ${refW} ${refH}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <image href={background.value} x={0} y={0} width={refW} height={refH} preserveAspectRatio="none" style={{ pointerEvents: 'none' }} />
              <rect x={0} y={0} width={refW} height={refH} fill="transparent" className="floor-editor-stage-hit" onClick={handleStageClick} />
              {placements.map((p) => {
                const isSel = p.localId === selectedId;
                const { x, y } = placementCenterPx(p, refW, refH);
                const isRoom = p.kind === 'meeting_room';
                const fill = isSel ? 'rgba(10,132,255,0.85)' : isRoom ? 'rgba(255,159,10,0.82)' : 'rgba(48,209,88,0.75)';
                return (
                  <g key={p.localId} data-editor-marker>
                    <circle
                      cx={x}
                      cy={y}
                      r={MARKER_RADIUS_PX}
                      fill={fill}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={2}
                      style={{ cursor: 'grab' }}
                      onPointerDown={(e) => handleMarkerPointerDown(e, p)}
                      onPointerMove={handleMarkerPointerMove}
                      onPointerUp={handleMarkerPointerUp}
                      onPointerCancel={handleMarkerPointerUp}
                    />
                    <text x={x} y={y + 4} textAnchor="middle" className="floor-editor-svg-label" style={{ pointerEvents: 'none' }}>
                      {p.localId}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </main>
  );
}
