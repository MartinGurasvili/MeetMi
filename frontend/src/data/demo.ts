import type { Equipment, OfficeFloor, Space } from '../types';
import { layoutManagedFloorIds, officeFloorsFromLayoutsOnly, spacesFromLayouts } from './floorLayoutsIndex';

export const demoEquipment: Equipment[] = ['monitor', 'docking station', 'standing desk', 'whiteboard', 'projector', 'video conferencing', 'speakers', 'accessibility access'].map((name, index) => ({ id: index + 1, name }));

const baseDemoFloors: OfficeFloor[] = [
  { id: 1, name: 'Manchester Office', floor_number: 1, is_active: true },
  { id: 3, name: 'London Office', floor_number: 7, is_active: true },
];

const baseFloorIds = new Set(baseDemoFloors.map((f) => f.id));

/** Layout JSONs with `floorMeta` add floors/spaces automatically; drop a file under `floorLayouts/` and set `floorMeta` in the export. */
export const demoFloors: OfficeFloor[] = [...baseDemoFloors, ...officeFloorsFromLayoutsOnly(baseFloorIds)].sort((a, b) => a.id - b.id);

const managedFloorIds = layoutManagedFloorIds();

const deskCoordinates = [
  // Coordinates align to built-in SVG in FloorPlan.tsx (ignored when a layout JSON manages that floor_id).
  [1, 150, 226, 'Manchester West'], [1, 290, 178, 'Manchester West'], [1, 186, 342, 'Manchester West'], [1, 322, 318, 'Manchester West'],
  [1, 224, 454, 'Manchester West'], [1, 270, 554, 'Manchester West'], [1, 632, 430, 'Manchester Central'], [1, 704, 660, 'Manchester Central'],
  [1, 736, 210, 'Manchester East'], [1, 858, 210, 'Manchester East'], [1, 740, 312, 'Manchester East'], [1, 862, 516, 'Manchester East'],
  [3, 276, 594, 'London West'], [3, 362, 562, 'London West'], [3, 524, 548, 'London Central'], [3, 404, 584, 'London Central'],
  [3, 728, 272, 'London East'], [3, 834, 312, 'London East'], [3, 812, 202, 'London East'], [3, 758, 486, 'London East'],
] as const;

const desks: Space[] = deskCoordinates
  .filter(([floor_id]) => !managedFloorIds.has(floor_id))
  .map(([floor_id, x, y, zone], index) => ({
    id: index + 1,
    floor_id,
    name: `Desk ${floor_id === 1 ? 'M' : 'L'}${String(index + 1).padStart(2, '0')}`,
    type: 'hot_desk' as const,
    zone,
    x_coordinate: x,
    y_coordinate: y,
    capacity: 1,
    is_active: true,
    description: 'Ergonomic hot desk with focused lighting and premium accessories.',
    equipment: [demoEquipment[index % demoEquipment.length], demoEquipment[(index + 1) % demoEquipment.length]],
  }));

const roomCoordinates = [
  [1, 'Manchester Boardroom', 176, 128, 'Manchester West', 12],
  [1, 'Manchester Focus Room', 272, 676, 'Manchester West', 4],
  [1, 'Manchester Bridge Room', 560, 520, 'Manchester Central', 6],
  [1, 'Manchester East Suite', 874, 406, 'Manchester East', 10],
  [3, 'London Client Room', 190, 654, 'London West', 8],
  [3, 'London Studio', 494, 584, 'London Central', 6],
  [3, 'London Roundtable', 820, 438, 'London East', 10],
  [3, 'London Quiet Room', 814, 132, 'London East', 4],
] as const;

const rooms: Space[] = roomCoordinates
  .filter(([floor_id]) => !managedFloorIds.has(floor_id))
  .map(([floor_id, name, x, y, zone, capacity], index) => ({
    id: 21 + index,
    floor_id,
    name,
    type: 'meeting_room' as const,
    zone,
    x_coordinate: x,
    y_coordinate: y,
    capacity,
    is_active: true,
    description: 'Premium meeting room with collaboration-ready AV and image preview support.',
    equipment: [demoEquipment[3], demoEquipment[4], demoEquipment[5], demoEquipment[6]],
  }));

export const demoSpaces: Space[] = (() => {
  const manual = [...desks, ...rooms];
  const maxManual = manual.reduce((m, s) => Math.max(m, s.id), 0);
  return [...manual, ...spacesFromLayouts(demoEquipment, maxManual)];
})();

/** Keep layout-driven floors from demo when the API omits `layoutLocalId` / placement alignment. */
export function mergeApiSpacesWithLayoutFloors(apiSpaces: Space[]): Space[] {
  const managed = layoutManagedFloorIds();
  const fromDemo = demoSpaces.filter((s) => managed.has(s.floor_id));
  const fromApi = apiSpaces.filter((s) => !managed.has(s.floor_id));
  return [...fromApi, ...fromDemo];
}
