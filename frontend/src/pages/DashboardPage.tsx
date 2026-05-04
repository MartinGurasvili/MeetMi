import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import BookingModal from '../components/BookingModal';
import FilterPanel from '../components/FilterPanel';
import FloorPlan from '../components/FloorPlan';
import RecommendationPanel from '../components/RecommendationPanel';
import SpaceDetailsPanel from '../components/SpaceDetailsPanel';
import { demoEquipment, demoFloors, demoSpaces } from '../data/demo';
import type { Filters, Recommendation, Space } from '../types';

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const initialFilters: Filters = { date: tomorrow, start: '09:00', end: '10:00', spaceType: 'hot_desk', attendeeCount: 1, requiredEquipmentIds: [], optionalEquipmentIds: [], preferredZone: '' };

export default function DashboardPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [floorId, setFloorId] = useState(1);
  const [spaces, setSpaces] = useState(demoSpaces);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  useEffect(() => { api.spaces().then(setSpaces).catch(() => setSpaces(demoSpaces)); }, []);
  useEffect(() => { api.recommendations(filters).then(setRecommendations).catch(() => setRecommendations([])); }, [filters]);
  const visibleSpaces = useMemo(() => spaces.filter((space) => space.floor_id === floorId && space.type === filters.spaceType && space.capacity >= filters.attendeeCount && filters.requiredEquipmentIds.every((id) => space.equipment.some((item) => item.id === id))), [spaces, floorId, filters]);
  const selectedVisible = selected && visibleSpaces.some((space) => space.id === selected.id) ? selected : null;
  async function confirmBooking() { if (!selected) return; try { await api.createBooking({ space_id: selected.id, title: `MeetMi booking for ${selected.name}`, start_time: `${filters.date}T${filters.start}:00.000Z`, end_time: `${filters.date}T${filters.end}:00.000Z`, attendee_count: filters.attendeeCount }); setBookingOpen(false); } catch { setBookingOpen(false); } }
  return <main className="mx-auto grid max-w-7xl gap-5 px-6 pb-12 lg:grid-cols-[320px_1fr_320px]"><FilterPanel filters={filters} equipment={demoEquipment} onChange={setFilters} /><div><header className="mb-4 flex items-center justify-between"><div><p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Live floor plan</p><h1 className="text-4xl font-semibold">Book a perfect workspace</h1></div><select className="rounded-full bg-white/10 px-4 py-2" value={floorId} onChange={(e) => setFloorId(Number(e.target.value))}>{demoFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</select></header><FloorPlan spaces={visibleSpaces} selectedSpace={selectedVisible} recommendedSpaceIds={recommendations.map((item) => item.space.id)} onSelectSpace={setSelected} /></div><div className="grid content-start gap-5"><RecommendationPanel recommendations={recommendations} onSelect={(id) => setSelected(spaces.find((space) => space.id === id) ?? null)} /><SpaceDetailsPanel space={selectedVisible} onBook={() => setBookingOpen(true)} /></div><BookingModal space={bookingOpen ? selected : null} filters={filters} onClose={() => setBookingOpen(false)} onConfirm={confirmBooking} /></main>;
}
