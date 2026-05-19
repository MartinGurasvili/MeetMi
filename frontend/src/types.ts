export type SpaceType = 'hot_desk' | 'meeting_room';
export type BookingStatus = 'confirmed' | 'cancelled';
export interface Equipment { id: number; name: string; description?: string | null }
export interface OfficeFloor { id: number; name: string; floor_number: number; description?: string | null; is_active: boolean }
export interface Space { id: number; floor_id: number; name: string; type: SpaceType; zone: string; x_coordinate: number; y_coordinate: number; z_coordinate?: number | null; capacity: number; description?: string | null; image_url?: string | null; is_active: boolean; equipment: Equipment[]; /** API value used by backend/RDS. */ layout_local_id?: number | null; /** Frontend value used to match `PlacementV1.localId` while `id` stays unique for booking/API. */ layoutLocalId?: number | null }
export interface Booking { id: number; user_id: number; space_id: number; title: string; start_time: string; end_time: string; attendee_count: number; status: BookingStatus; space?: Space }
export interface Recommendation { space: Space; score: number; explanation: string[] }
export interface User { id: number; email: string; full_name: string; role: 'user' | 'admin'; preferred_zone?: string | null }
export interface Filters { date: string; start: string; end: string; spaceType: SpaceType; attendeeCount: number; requiredEquipmentIds: number[]; optionalEquipmentIds: number[]; preferredZone: string }

/** v1 floor layout export: link to app spaces via Space.id === PlacementV1.localId */
export type FloorLayoutSchema = 'meetmi-floor-layout-v1';

export interface FloorLayoutBackground {
  kind: 'dataUrl' | 'publicPath';
  value: string;
}

/** hot_desk: nx, ny are center (0–1). meeting_room: nx, ny top-left of bbox; nw, nh span (0–1). */
export interface PlacementV1 {
  localId: number;
  kind: SpaceType;
  name?: string;
  zone?: string;
  capacity?: number;
  nx: number;
  ny: number;
  nw?: number;
  nh?: number;
}

/** When present, the app auto-registers this JSON for `floorLayoutForFloor(id)` and builds demo floors/spaces from `placements`. */
export interface FloorLayoutFloorMeta {
  id: number;
  name: string;
  floor_number: number;
  description?: string | null;
}

export interface FloorLayoutExportV1 {
  version: 1;
  schema: FloorLayoutSchema;
  title?: string;
  /** Wire this floor to the dashboard: registry + demo spaces/floor row (see floorLayoutsIndex). */
  floorMeta?: FloorLayoutFloorMeta;
  referenceSize: { w: number; h: number };
  background: FloorLayoutBackground;
  placements: PlacementV1[];
}
