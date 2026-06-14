import { useCallback, useRef, useState } from 'react';
import { ArrowRight, CalendarPlus, Sparkles, Upload } from 'lucide-react';
import { parseIcsFile } from '../lib/ics';
import type { ParsedIcsMeeting, Recommendation } from '../types';

interface Props {
  recommendations: Recommendation[];
  onSelect: (id: number) => void;
  onIcsParsed?: (meeting: ParsedIcsMeeting) => void;
}

export default function RecommendationPanel({ recommendations, onSelect, onIcsParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [lastMeeting, setLastMeeting] = useState<ParsedIcsMeeting | null>(null);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !onIcsParsed) return;
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
    <div className="dashboard-recommendations">
      <div className="dashboard-recommendation-header">
        <div className="dashboard-panel-heading">
          <span className="dashboard-symbol dashboard-symbol-green">
            <Sparkles size={16} aria-hidden />
          </span>
          <h2>Recommendations</h2>
        </div>
        <span className="dashboard-count-badge">
          {recommendations.length}
        </span>
      </div>

      {onIcsParsed ? (
        <>
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
            <Upload size={18} aria-hidden />
            <span>
              <strong>Drop an .ics invite</strong>
              <small>Find rooms for your meeting time and attendees</small>
            </span>
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
        </>
      ) : (
        <button type="button" className="dashboard-calendar-dropzone" disabled>
          <CalendarPlus size={18} aria-hidden />
          <span>
            <strong>Add calendar event</strong>
            <small>Sign in to import a calendar invite.</small>
          </span>
        </button>
      )}

      <div className="dashboard-recommendation-list">
        {recommendations.length === 0 ? (
          <div className="dashboard-empty-state">
            <p>No matches yet</p>
            <span>Drop an .ics file or adjust availability, capacity, and equipment.</span>
          </div>
        ) : null}

        {recommendations.slice(0, 4).map((item, index) => (
          <button
            key={item.space.id}
            type="button"
            className="dashboard-recommendation"
            onClick={() => onSelect(item.space.id)}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className="dashboard-score">
              {item.score}
            </span>
            <span>
              <strong>{item.space.name}</strong>
              <small>
                {item.explanation.join(', ')}
              </small>
            </span>
            <ArrowRight size={17} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
