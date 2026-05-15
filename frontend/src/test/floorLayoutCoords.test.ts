import { describe, expect, it } from 'vitest';
import { clamp01, placementCenterPx } from '../lib/floorLayoutCoords';

describe('floorLayoutCoords', () => {
  it('places hot desk at normalized center', () => {
    expect(placementCenterPx({ localId: 1, kind: 'hot_desk', nx: 0.5, ny: 0.25 }, 200, 100)).toEqual({ x: 100, y: 25 });
  });

  it('places meeting room at bbox center', () => {
    const c = placementCenterPx({ localId: 2, kind: 'meeting_room', nx: 0.1, ny: 0.2, nw: 0.4, nh: 0.2 }, 100, 100);
    expect(c.x).toBeCloseTo(30, 5);
    expect(c.y).toBeCloseTo(30, 5);
  });

  it('clamp01 bounds', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
  });
});
