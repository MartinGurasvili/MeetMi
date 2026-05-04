import { Monitor, Users, Wifi, Zap } from 'lucide-react';
import type { Space } from '../types';

interface Props {
  space: Space | null;
  onBook: () => void;
}

export default function SpaceDetailsDrawer({ space, onBook }: Props) {
  if (!space) return null;

  const typeLabel = space.type === 'hot_desk' ? 'Hot desk' : 'Meeting room';
  const fallbackEquipment = space.equipment.slice(0, 3).map((item) => item.name).join(', ');

  const variant = (space.id % 2) + 1;
  const fallbackImage =
    space.type === 'hot_desk' ? `/spaces/hotdesk-${variant}.png` : `/spaces/meetingroom-${variant}.png`;
  const previewSrc = space.image_url ?? fallbackImage;

  return (
    <div className="space-details-root">
      <div className="space-details-hero">
        <img
          key={previewSrc}
          src={previewSrc}
          alt={`${space.name} preview`}
          className="space-details-hero-img"
          loading="lazy"
        />
        <div className="space-details-hero-grad" aria-hidden>
          <span className="space-details-badge">{typeLabel}</span>
        </div>
      </div>

      <div className="space-details-scroll">
        <div className="space-details-stats">
          <div className="space-details-stat">
            <Users size={17} aria-hidden />
            <strong>{space.capacity}</strong>
            <span>Capacity</span>
          </div>
          <div className="space-details-stat">
            <Zap size={17} aria-hidden />
            <strong className="space-details-stat-zone">{space.zone}</strong>
            <span>Zone</span>
          </div>
        </div>

        {space.description ? <p className="space-details-desc">{space.description}</p> : null}

        <div className="space-details-card">
          <div className="space-details-card-head">
            <Monitor size={16} aria-hidden />
            <span>Best for</span>
          </div>
          <p className="space-details-card-body">{fallbackEquipment || 'Focused work and collaboration'}</p>
        </div>

        <div className="space-details-equip">
          <div className="space-details-card-head">
            <Wifi size={16} aria-hidden />
            <span>Equipment</span>
          </div>
          <div className="space-details-chip-row">
            {space.equipment.map((item) => (
              <span key={item.id} className="space-details-chip">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-details-footer">
        <button type="button" className="space-details-book" onClick={onBook}>
          Quick book
        </button>
      </div>
    </div>
  );
}
