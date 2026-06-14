import { useCallback, useRef, useState } from 'react';
import { CalendarPlus, Upload } from 'lucide-react';
import { parseIcsFile } from '../lib/ics';
import type { ParsedIcsMeeting } from '../types';

interface Props {
  onIcsParsed: (meeting: ParsedIcsMeeting) => void;
}

export default function IcsRecommender({ onIcsParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [lastMeeting, setLastMeeting] = useState<ParsedIcsMeeting | null>(null);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setError('');
      try {
        const meeting = await parseIcsFile(file);
        setLastMeeting(meeting);
        onIcsParsed(meeting);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read this calendar file.');
      }
    },
    [onIcsParsed],
  );

  return (
    <div className="ics-recommender">
      <div className="dashboard-panel-heading">
        <span className="dashboard-symbol dashboard-symbol-blue">
          <CalendarPlus size={16} aria-hidden />
        </span>
        <span>
          <span className="dashboard-panel-title">ICS recommender</span>
          <span className="dashboard-subtle">Drop a meeting invite to find rooms</span>
        </span>
      </div>

      <div
        className={dragActive ? 'ics-dropzone is-active' : 'ics-dropzone'}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload ICS calendar file"
      >
        <Upload size={20} aria-hidden />
        <span>Drag & drop an .ics file here</span>
        <span className="ics-dropzone-hint">or click to browse</span>
        <input
          ref={inputRef}
          type="file"
          accept=".ics,text/calendar"
          className="ics-file-input"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>

      {lastMeeting ? (
        <p className="ics-recommender-summary">
          Parsed <strong>{lastMeeting.summary}</strong> for {lastMeeting.attendeeCount} people on {lastMeeting.date} ({lastMeeting.start}–{lastMeeting.end}).
        </p>
      ) : null}
      {error ? <p className="ics-recommender-error">{error}</p> : null}
    </div>
  );
}
