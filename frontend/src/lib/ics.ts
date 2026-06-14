import { nextWeekdayIso, normalizeWeekdayDate, parseIsoDate } from './dates';
import type { ParsedIcsMeeting } from '../types';

function unfoldIcsLines(content: string) {
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDateTime(value: string) {
  const trimmed = value.trim();
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(trimmed);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, zulu] = match;
  const y = Number(year);
  const m = Number(month) - 1;
  const d = Number(day);
  const h = Number(hour);
  const min = Number(minute);
  const s = Number(second);
  if (zulu) {
    return new Date(Date.UTC(y, m, d, h, min, s));
  }
  return new Date(y, m, d, h, min, s);
}

function rollToNextWeekday() {
  const rolledDateStr = normalizeWeekdayDate(nextWeekdayIso());
  return parseIsoDate(rolledDateStr) ?? new Date();
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export async function parseIcsFile(file: File): Promise<ParsedIcsMeeting> {
  const content = await file.text();
  const lines = unfoldIcsLines(content);
  let summary = 'Meeting';
  let start: Date | null = null;
  let end: Date | null = null;
  let attendeeCount = 0;

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) summary = line.slice('SUMMARY:'.length).trim();
    if (line.startsWith('DTSTART')) {
      const value = line.split(':').pop() ?? '';
      start = parseIcsDateTime(value);
    }
    if (line.startsWith('DTEND')) {
      const value = line.split(':').pop() ?? '';
      end = parseIcsDateTime(value);
    }
    if (line.startsWith('ATTENDEE')) attendeeCount += 1;
  }

  if (!start || !end) {
    throw new Error('ICS file is missing DTSTART or DTEND.');
  }

  const rolledDate = rollToNextWeekday();
  const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
  const adjustedStart = new Date(rolledDate);
  adjustedStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  const adjustedEnd = new Date(rolledDate);
  adjustedEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  if (adjustedEnd <= adjustedStart) {
    adjustedEnd.setMinutes(adjustedEnd.getMinutes() + 60);
  }

  return {
    summary,
    date: normalizeWeekdayDate(nextWeekdayIso()),
    start: formatTime(adjustedStart),
    end: formatTime(adjustedEnd),
    attendeeCount: Math.max(attendeeCount, 1),
  };
}

export function parsedMeetingToFilters(meeting: ParsedIcsMeeting) {
  return {
    date: meeting.date,
    start: meeting.start,
    end: meeting.end,
    spaceType: 'meeting_room' as const,
    attendeeCount: meeting.attendeeCount,
  };
}
