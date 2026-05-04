import { type DragEvent, useRef, useState } from 'react';
import { ArrowRight, CalendarPlus, Sparkles } from 'lucide-react';
import type { Recommendation } from '../types';

interface Props {
  recommendations: Recommendation[];
  onSelect: (id: number) => void;
}

export default function RecommendationPanel({ recommendations, onSelect }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [calendarMessage, setCalendarMessage] = useState('Drag a Teams or calendar event here, or click to add one.');

  function handleCalendarIntent() {
    setCalendarMessage('Calendar import is ready for UI testing. Event parsing will be added later.');
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    handleCalendarIntent();
  }

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

      <button
        type="button"
        className="dashboard-calendar-dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <CalendarPlus size={18} aria-hidden />
        <span>
          <strong>Add calendar event</strong>
          <small>{calendarMessage}</small>
        </span>
      </button>
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".ics,.ical,text/calendar"
        onChange={handleCalendarIntent}
        aria-label="Choose calendar event"
      />

      <div className="dashboard-recommendation-list">
        {recommendations.length === 0 ? (
          <div className="dashboard-empty-state">
            <p>No matches yet</p>
            <span>Adjust availability, capacity, or equipment.</span>
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
