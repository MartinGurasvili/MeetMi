import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import FloorPlan from '../components/FloorPlan';
import { demoSpaces } from '../data/demo';
import type { FloorLayoutExportV1, Space } from '../types';

const tinyLayout: FloorLayoutExportV1 = {
  version: 1,
  schema: 'meetmi-floor-layout-v1',
  title: 'Test layout',
  referenceSize: { w: 400, h: 300 },
  background: {
    kind: 'dataUrl',
    value: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#222"/></svg>'),
  },
  placements: [
    { localId: 301, kind: 'hot_desk', nx: 0.25, ny: 0.5 },
    { localId: 303, kind: 'meeting_room', nx: 0.5, ny: 0.4, nw: 0.2, nh: 0.15 },
  ],
};

it('renders spaces from coordinates', () => {
  render(<FloorPlan spaces={demoSpaces.slice(0, 3)} onSelectSpace={() => undefined} />);
  expect(screen.getAllByTestId('space-marker')).toHaveLength(3);
});

it('renders markers from imported layout when space ids match localId', () => {
  const spaces: Space[] = [
    {
      id: 301,
      floor_id: 3,
      name: 'Layout Desk',
      type: 'hot_desk',
      zone: 'Z',
      x_coordinate: 0,
      y_coordinate: 0,
      capacity: 1,
      is_active: true,
      equipment: [],
    },
    {
      id: 303,
      floor_id: 3,
      name: 'Layout Room',
      type: 'meeting_room',
      zone: 'Z',
      x_coordinate: 0,
      y_coordinate: 0,
      capacity: 6,
      is_active: true,
      equipment: [],
    },
  ];
  render(<FloorPlan spaces={spaces} floorId={3} layout={tinyLayout} onSelectSpace={() => undefined} />);
  expect(screen.getAllByTestId('space-marker')).toHaveLength(2);
  expect(screen.getByLabelText('Layout Desk')).toBeInTheDocument();
  expect(screen.getByLabelText('Layout Room')).toBeInTheDocument();
});

it('opens selection callback from marker', async () => {
  const onSelect = vi.fn();
  render(<FloorPlan spaces={demoSpaces.slice(0, 1)} onSelectSpace={onSelect} />);
  await userEvent.click(screen.getByLabelText('Desk M01'));
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Desk M01' }));
});
