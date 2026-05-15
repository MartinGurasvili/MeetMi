import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import RecommendationPanel from '../components/RecommendationPanel';
import type { Space } from '../types';

const sampleDesk: Space = {
  id: 1,
  floor_id: 1,
  name: 'Desk M01',
  type: 'hot_desk',
  zone: 'Manchester West',
  x_coordinate: 150,
  y_coordinate: 226,
  capacity: 1,
  is_active: true,
  equipment: [],
};

it('displays the best space recommendation', () => {
  render(
    <RecommendationPanel
      recommendations={[{ space: sampleDesk, score: 113, explanation: ['Available', 'Exact capacity fit'] }]}
      onSelect={() => undefined}
    />,
  );
  expect(screen.getByText('Desk M01')).toBeInTheDocument();
  expect(screen.getByText('113')).toBeInTheDocument();
});
