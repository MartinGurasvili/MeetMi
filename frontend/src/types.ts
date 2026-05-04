export type SpaceType = 'hot_desk' | 'meeting_room';
export type BookingStatus = 'confirmed' | 'cancelled';
export interface Equipment { id: number; name: string; description?: string | null }
export interface OfficeFloor { id: number; name: string; floor_number: number; description?: string | null; is_active: boolean }
export interface Space { id: number; floor_id: number; name: string; type: SpaceType; zone: string; x_coordinate: number; y_coordinate: number; z_coordinate?: number | null; capacity: number; description?: string | null; image_url?: string | null; is_active: boolean; equipment: Equipment[] }
export interface Booking { id: number; user_id: number; space_id: number; title: string; start_time: string; end_time: string; attendee_count: number; status: BookingStatus; space?: Space }
export interface Recommendation { space: Space; score: number; explanation: string[] }
export interface User { id: number; email: string; full_name: string; role: 'user' | 'admin'; preferred_zone?: string | null }
export interface Filters { date: string; start: string; end: string; spaceType: SpaceType; attendeeCount: number; requiredEquipmentIds: number[]; optionalEquipmentIds: number[]; preferredZone: string }
