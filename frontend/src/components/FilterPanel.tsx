import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Clock, MapPin, Monitor, Users } from 'lucide-react';
import type { Equipment, Filters, SpaceType } from '../types';

interface Props {
  filters: Filters;
  equipment: Equipment[];
  onChange: (filters: Filters) => void;
}

const spaceTypes: Array<{ value: SpaceType; label: string }> = [
  { value: 'hot_desk', label: 'Hot desk' },
  { value: 'meeting_room', label: 'Meeting room' },
];

export default function FilterPanel({ filters, equipment, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  const toggleEquipment = (id: number) =>
    update(
      'requiredEquipmentIds',
      filters.requiredEquipmentIds.includes(id)
        ? filters.requiredEquipmentIds.filter((item) => item !== id)
        : [...filters.requiredEquipmentIds, id],
    );

  return (
    <div className="dashboard-filter-panel">
      <button
        type="button"
        className="dashboard-panel-toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="dashboard-panel-heading">
          <span className="dashboard-symbol dashboard-symbol-orange">
            <Monitor size={16} aria-hidden />
          </span>
          <span>
            <span className="dashboard-panel-title">Filters</span>
            <span className="dashboard-subtle">
              {filters.spaceType === 'hot_desk' ? 'Hot desk' : 'Meeting room'} - {filters.start}-{filters.end}
            </span>
          </span>
        </span>
        {expanded ? (
          <ChevronUp size={18} aria-hidden />
        ) : (
          <ChevronDown size={18} aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="dashboard-filter-body">
          <div>
            <p className="dashboard-label">Space type</p>
            <div className="dashboard-segmented">
              {spaceTypes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={filters.spaceType === item.value ? 'dashboard-segment is-active' : 'dashboard-segment'}
                  onClick={() => update('spaceType', item.value)}
                  aria-pressed={filters.spaceType === item.value}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="dashboard-field-label">
            <span>
              <CalendarDays size={15} aria-hidden />
              Date
            </span>
            <input className="dashboard-field" type="date" value={filters.date} onChange={(event) => update('date', event.target.value)} />
          </label>

          <div className="dashboard-field-grid">
            <label className="dashboard-field-label">
              <span>
                <Clock size={15} aria-hidden />
                Start
              </span>
              <input className="dashboard-field" type="time" value={filters.start} onChange={(event) => update('start', event.target.value)} />
            </label>
            <label className="dashboard-field-label">
              <span>
                <Clock size={15} aria-hidden />
                End
              </span>
              <input className="dashboard-field" type="time" value={filters.end} onChange={(event) => update('end', event.target.value)} />
            </label>
          </div>

          <div className="dashboard-field-grid">
            <label className="dashboard-field-label">
              <span>
                <Users size={15} aria-hidden />
                Attendees
              </span>
              <input
                className="dashboard-field"
                min={1}
                max={100}
                type="number"
                value={filters.attendeeCount}
                onChange={(event) => update('attendeeCount', Math.max(1, Number(event.target.value) || 1))}
              />
            </label>
            <label className="dashboard-field-label">
              <span>
                <MapPin size={15} aria-hidden />
                Zone
              </span>
              <input
                className="dashboard-field"
                value={filters.preferredZone}
                onChange={(event) => update('preferredZone', event.target.value)}
                placeholder="East"
              />
            </label>
          </div>

          <div>
            <p className="dashboard-label">
              Required equipment
            </p>
            <div className="dashboard-chip-list">
              {equipment.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={filters.requiredEquipmentIds.includes(item.id) ? 'dashboard-chip is-active' : 'dashboard-chip'}
                  onClick={() => toggleEquipment(item.id)}
                  aria-pressed={filters.requiredEquipmentIds.includes(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
