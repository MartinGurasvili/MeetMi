import type { Equipment, OfficeFloor, Space } from '../types';

export const demoEquipment: Equipment[] = ['monitor', 'docking station', 'standing desk', 'whiteboard', 'projector', 'video conferencing', 'speakers', 'accessibility access'].map((name, index) => ({ id: index + 1, name }));
export const demoFloors: OfficeFloor[] = [
  { id: 1, name: 'Manchester Office', floor_number: 1, is_active: true },
  { id: 2, name: 'London Office', floor_number: 7, is_active: true },
];

const deskCoordinates = [
  // Coordinates are aligned to the generated SVG floor geometry in FloorPlan.tsx.
  [1, 152, 236, 'Manchester West'], [1, 260, 224, 'Manchester West'], [1, 196, 360, 'Manchester West'], [1, 308, 350, 'Manchester West'],
  [1, 238, 492, 'Manchester West'], [1, 330, 590, 'Manchester West'], [1, 642, 426, 'Manchester Central'], [1, 700, 658, 'Manchester Central'],
  [1, 730, 210, 'Manchester East'], [1, 852, 210, 'Manchester East'], [1, 734, 320, 'Manchester East'], [1, 856, 570, 'Manchester East'],
  [2, 276, 594, 'London West'], [2, 362, 562, 'London West'], [2, 524, 548, 'London Central'], [2, 404, 584, 'London Central'],
  [2, 728, 272, 'London East'], [2, 834, 312, 'London East'], [2, 812, 202, 'London East'], [2, 758, 486, 'London East'],
] as const;

const desks: Space[] = deskCoordinates.map(([floor_id, x, y, zone], index) => ({
  id: index + 1,
  floor_id,
  name: `Desk ${floor_id === 1 ? 'M' : 'L'}${String(index + 1).padStart(2, '0')}`,
  type: 'hot_desk',
  zone,
  x_coordinate: x,
  y_coordinate: y,
  capacity: 1,
  is_active: true,
  description: 'Ergonomic hot desk with focused lighting and premium accessories.',
  equipment: [demoEquipment[index % demoEquipment.length], demoEquipment[(index + 1) % demoEquipment.length]],
}));

const roomCoordinates = [
  [1, 'Manchester Boardroom', 182, 128, 'Manchester West', 12],
  [1, 'Manchester Focus Room', 246, 680, 'Manchester West', 4],
  [1, 'Manchester Bridge Room', 552, 530, 'Manchester Central', 6],
  [1, 'Manchester East Suite', 862, 414, 'Manchester East', 10],
  [2, 'London Client Room', 190, 654, 'London West', 8],
  [2, 'London Studio', 494, 584, 'London Central', 6],
  [2, 'London Roundtable', 820, 438, 'London East', 10],
  [2, 'London Quiet Room', 814, 132, 'London East', 4],
] as const;

const rooms: Space[] = roomCoordinates.map(([floor_id, name, x, y, zone, capacity], index) => ({
  id: 21 + index,
  floor_id,
  name,
  type: 'meeting_room',
  zone,
  x_coordinate: x,
  y_coordinate: y,
  capacity,
  is_active: true,
  description: 'Premium meeting room with collaboration-ready AV and image preview support.',
  equipment: [demoEquipment[3], demoEquipment[4], demoEquipment[5], demoEquipment[6]],
}));
export const demoSpaces: Space[] = [...desks, ...rooms];
