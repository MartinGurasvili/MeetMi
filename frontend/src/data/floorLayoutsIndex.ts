import type { Equipment, FloorLayoutExportV1, OfficeFloor, Space } from '../types';

const layoutModules = import.meta.glob('./floorLayouts/*.json', { eager: true }) as Record<string, { default: unknown }>;

function asLayout(mod: unknown): FloorLayoutExportV1 | null {
  if (!mod || typeof mod !== 'object' || !('default' in mod)) return null;
  const d = (mod as { default: unknown }).default;
  if (!d || typeof d !== 'object') return null;
  const L = d as Partial<FloorLayoutExportV1>;
  if (L.schema !== 'meetmi-floor-layout-v1' || L.version !== 1) return null;
  return d as FloorLayoutExportV1;
}

/** Sorted for stable “first file wins” when the same floor id appears twice. */
function sortedLayoutEntries(): { path: string; layout: FloorLayoutExportV1 }[] {
  return Object.keys(layoutModules)
    .sort()
    .map((path) => {
      const layout = asLayout(layoutModules[path]);
      return layout ? { path, layout } : null;
    })
    .filter((x): x is { path: string; layout: FloorLayoutExportV1 } => x != null);
}

/** Floors that are fully driven by a layout JSON (manual demo desks/rooms for that floor_id are omitted). */
export function layoutManagedFloorIds(): Set<number> {
  const ids = new Set<number>();
  for (const { layout } of sortedLayoutEntries()) {
    const id = layout.floorMeta?.id;
    if (id != null) ids.add(id);
  }
  return ids;
}

export function buildFloorLayoutRegistry(): Partial<Record<number, FloorLayoutExportV1>> {
  const registry: Partial<Record<number, FloorLayoutExportV1>> = {};
  for (const { layout } of sortedLayoutEntries()) {
    const id = layout.floorMeta?.id;
    if (id == null || registry[id]) continue;
    registry[id] = layout;
  }
  return registry;
}

export const floorLayoutByFloorId: Partial<Record<number, FloorLayoutExportV1>> = buildFloorLayoutRegistry();

export function floorLayoutForFloor(floorId: number): FloorLayoutExportV1 | undefined {
  return floorLayoutByFloorId[floorId];
}

/** Extra floors declared only in layout JSON (ids not already in baseDemoFloors). */
export function officeFloorsFromLayoutsOnly(baseIds: Set<number>): OfficeFloor[] {
  const out: OfficeFloor[] = [];
  const seen = new Set<number>();
  for (const { layout } of sortedLayoutEntries()) {
    const fm = layout.floorMeta;
    if (!fm || baseIds.has(fm.id) || seen.has(fm.id)) continue;
    seen.add(fm.id);
    out.push({
      id: fm.id,
      name: fm.name,
      floor_number: fm.floor_number,
      description: fm.description ?? layout.title ?? null,
      is_active: true,
    });
  }
  return out;
}

/** Spaces derived from placements; `id` is unique; `layoutLocalId` maps to JSON `localId` for the floor plan. */
export function spacesFromLayouts(equipment: Equipment[], startId: number): Space[] {
  const list: Space[] = [];
  let nextId = startId;
  const usedFloorIds = new Set<number>();
  for (const { layout } of sortedLayoutEntries()) {
    const fm = layout.floorMeta;
    if (!fm || usedFloorIds.has(fm.id)) continue;
    usedFloorIds.add(fm.id);
    for (const p of layout.placements) {
      nextId += 1;
      list.push({
        id: nextId,
        layoutLocalId: p.localId,
        floor_id: fm.id,
        name: p.name ?? (p.kind === 'hot_desk' ? `Desk ${p.localId}` : `Room ${p.localId}`),
        type: p.kind,
        zone: p.zone ?? 'General',
        x_coordinate: 0,
        y_coordinate: 0,
        capacity: p.capacity ?? (p.kind === 'hot_desk' ? 1 : 6),
        is_active: true,
        description:
          p.kind === 'hot_desk' ? 'Hot desk from imported floor layout.' : 'Meeting room from imported floor layout.',
        equipment: [equipment[p.localId % equipment.length], equipment[(p.localId + 1) % equipment.length]],
      });
    }
  }
  return list;
}
