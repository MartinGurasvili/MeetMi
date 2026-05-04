import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import RecommendationPanel from '../components/RecommendationPanel';
import { demoSpaces } from '../data/demo';

it('displays the best space recommendation', () => {
  render(<RecommendationPanel recommendations={[{ space: demoSpaces[0], score: 113, explanation: ['Available', 'Exact capacity fit'] }]} onSelect={() => undefined} />);
  expect(screen.getByText('Desk A01')).toBeInTheDocument();
  expect(screen.getByText('113')).toBeInTheDocument();
});
