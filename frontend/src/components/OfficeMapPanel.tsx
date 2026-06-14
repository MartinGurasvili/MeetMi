import type { Equipment, Filters, ParsedIcsMeeting, Recommendation } from '../types';
import FilterPanel from './FilterPanel';
import RecommendationPanel from './RecommendationPanel';

interface OfficeMapPanelProps {
  filters: Filters;
  equipment: Equipment[];
  onFiltersChange: (filters: Filters) => void;
  recommendations: Recommendation[];
  onRecommendationSelect: (spaceId: number) => void;
  onIcsParsed: (meeting: ParsedIcsMeeting) => void;
}

export default function OfficeMapPanel({
  filters,
  equipment,
  onFiltersChange,
  recommendations,
  onRecommendationSelect,
  onIcsParsed,
}: OfficeMapPanelProps) {
  return (
    <aside className="dashboard-control-stack">
      <section className="dashboard-panel">
        <RecommendationPanel
          recommendations={recommendations}
          onSelect={onRecommendationSelect}
          onIcsParsed={onIcsParsed}
        />
      </section>

      <section className="dashboard-panel">
        <FilterPanel filters={filters} equipment={equipment} onChange={onFiltersChange} />
      </section>
    </aside>
  );
}
