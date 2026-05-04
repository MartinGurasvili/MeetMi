import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as apiModule from '../api/client';
import { AuthProvider } from '../contexts/AuthContext';
import { demoSpaces } from '../data/demo';
import DashboardPage from '../pages/DashboardPage';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.spyOn(apiModule.api, 'refreshAccessToken').mockRejectedValue(new Error('no refresh'));
  vi.spyOn(apiModule.api, 'me').mockRejectedValue(new Error('no session'));
  vi.spyOn(apiModule.api, 'spaces').mockResolvedValue(demoSpaces);
  vi.spyOn(apiModule.api, 'recommendations').mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('renders recommendation panel and floor controls', async () => {
  renderDashboard();
  expect(await screen.findByText('Recommendations')).toBeInTheDocument();
  expect(screen.getByLabelText('Interactive office floor plan')).toBeInTheDocument();
});
