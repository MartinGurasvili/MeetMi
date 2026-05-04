import type { Recommendation } from '../types';
interface Props { recommendations: Recommendation[]; onSelect: (id: number) => void }
export default function RecommendationPanel({ recommendations, onSelect }: Props) {
  return <aside className="glass rounded-[2rem] p-5"><h2 className="text-lg font-semibold">Recommended spaces</h2><div className="mt-4 grid gap-3">{recommendations.length === 0 && <p className="text-sm text-slate-400">Adjust filters to see ranked suggestions.</p>}{recommendations.slice(0, 4).map((item) => <button key={item.space.id} onClick={() => onSelect(item.space.id)} className="rounded-2xl bg-white/10 p-4 text-left hover:bg-white/15"><div className="flex items-center justify-between"><span className="font-semibold">{item.space.name}</span><span className="text-cyan-200">{item.score}</span></div><p className="mt-1 text-xs text-slate-400">{item.explanation.join(' . ')}</p></button>)}</div></aside>;
}
