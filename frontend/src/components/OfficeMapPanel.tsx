import type { Equipment, Filters, Recommendation } from '../types';
import FilterPanel from './FilterPanel';
import RecommendationPanel from './RecommendationPanel';

interface OfficeMapPanelProps {
  filters: Filters;
  equipment: Equipment[];
  onFiltersChange: (filters: Filters) => void;
  recommendations: Recommendation[];
  onRecommendationSelect: (spaceId: number) => void;
}

export default function OfficeMapPanel({
  filters,
  equipment,
  onFiltersChange,
  recommendations,
  onRecommendationSelect,
}: OfficeMapPanelProps) {
  return (
    <aside className="dashboard-control-stack">
      <section className="dashboard-panel">
        <RecommendationPanel recommendations={recommendations} onSelect={onRecommendationSelect} />
      </section>

      <section className="dashboard-panel">
        <FilterPanel filters={filters} equipment={equipment} onChange={onFiltersChange} />
      </section>
    </aside>
  );
}
