import type { PlacementV1 } from '../types';

export function placementCenterPx(p: PlacementV1, w: number, h: number): { x: number; y: number } {
  if (p.kind === 'meeting_room' && p.nw != null && p.nh != null) {
    return { x: (p.nx + p.nw / 2) * w, y: (p.ny + p.nh / 2) * h };
  }
  return { x: p.nx * w, y: p.ny * h };
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
