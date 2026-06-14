import { describe, expect, it } from 'vitest';
import { parseIcsFile } from '../lib/ics';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Aurora Core AI team - Daily Stand-up
DTSTART:20260101T100000Z
DTEND:20260101T101500Z
ATTENDEE;CN=One:mailto:one@example.com
ATTENDEE;CN=Two:mailto:two@example.com
ATTENDEE;CN=Three:mailto:three@example.com
END:VEVENT
END:VCALENDAR`;

describe('parseIcsFile', () => {
  it('extracts summary, attendee count, and rolls past dates to a weekday', async () => {
    const file = new File([SAMPLE_ICS], 'standup.ics', { type: 'text/calendar' });
    const meeting = await parseIcsFile(file);

    expect(meeting.summary).toContain('Aurora Core AI team');
    expect(meeting.attendeeCount).toBe(3);
    expect(meeting.start).toMatch(/^\d{2}:\d{2}$/);
    expect(meeting.end).toMatch(/^\d{2}:\d{2}$/);
    expect(meeting.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const parsed = new Date(`${meeting.date}T12:00:00`);
    expect(parsed.getDay()).toBeGreaterThan(0);
    expect(parsed.getDay()).toBeLessThan(6);
  });
});
