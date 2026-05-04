import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import DashboardPage from '../pages/DashboardPage';

it('renders recommendation panel and floor controls', () => {
  render(<DashboardPage />);
  expect(screen.getByText('Recommended spaces')).toBeInTheDocument();
  expect(screen.getByLabelText('Interactive office floor plan')).toBeInTheDocument();
});
