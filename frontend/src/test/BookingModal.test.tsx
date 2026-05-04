import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import BookingModal from '../components/BookingModal';
import { demoSpaces } from '../data/demo';

it('booking modal opens from selected marker state and confirms', async () => {
  const onConfirm = vi.fn();
  render(<BookingModal space={demoSpaces[0]} filters={{ date: '2026-04-26', start: '09:00', end: '10:00', spaceType: 'hot_desk', attendeeCount: 1, requiredEquipmentIds: [], optionalEquipmentIds: [], preferredZone: '' }} onClose={() => undefined} onConfirm={onConfirm} />);
  expect(screen.getByText('Confirm booking')).toBeInTheDocument();
  await userEvent.click(screen.getByText('Confirm'));
  expect(onConfirm).toHaveBeenCalled();
});
