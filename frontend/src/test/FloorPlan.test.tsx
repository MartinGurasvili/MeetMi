import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import FloorPlan from '../components/FloorPlan';
import { demoSpaces } from '../data/demo';

it('renders spaces from coordinates', () => {
  render(<FloorPlan spaces={demoSpaces.slice(0, 3)} onSelectSpace={() => undefined} />);
  expect(screen.getAllByTestId('space-marker')).toHaveLength(3);
});

it('opens selection callback from marker', async () => {
  const onSelect = vi.fn();
  render(<FloorPlan spaces={demoSpaces.slice(0, 1)} onSelectSpace={onSelect} />);
  await userEvent.click(screen.getByLabelText('Desk A01'));
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Desk A01' }));
});
