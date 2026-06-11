import { filtersToWindowIso } from '../lib/dates';
import type { AdminBookingRow, AvailabilitySummary, Booking, Equipment, Filters, OfficeFloor, Recommendation, Space, SpaceType, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

interface TokenPair {
  access_token: string;
  token_type?: string;
}

async function parseApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { detail?: unknown };
  const detail = body.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) return String(item.msg);
        return 'Validation failed';
      })
      .join('. ');
  }
  return 'Request failed';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (!response.ok) throw new Error(await parseApiError(response));
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  async login(email: string, password: string) {
    const token = await request<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setAccessToken(token.access_token);
    return token;
  },
  refreshAccessToken: () =>
    request<TokenPair>('/auth/refresh', { method: 'POST' }).then((token) => {
      setAccessToken(token.access_token);
      return token;
    }),
  logout: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch {
      /* network or session already cleared */
    } finally {
      setAccessToken(null);
    }
  },
  register: (payload: { email: string; full_name: string; password: string; preferred_zone?: string }) => request<User>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<User>('/auth/me'),
  floors: () => request<OfficeFloor[]>('/floors'),
  equipment: () => request<Equipment[]>('/equipment'),
  spaces: (floorId?: number) => request<Space[]>(`/spaces${floorId ? `?floor_id=${floorId}` : ''}`),
  myBookings: () => request<Booking[]>('/bookings'),
  createBooking: (payload: { space_id: number; title: string; start_time: string; end_time: string; attendee_count: number }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (id: number) => request<Booking>(`/bookings/${id}`, { method: 'DELETE' }),
  availability(filters: Pick<Filters, 'date' | 'start' | 'end'>) {
    return request<AvailabilitySummary>('/spaces/availability', {
      method: 'POST',
      body: JSON.stringify(filtersToWindowIso(filters)),
    });
  },
  bookedSpaceIds(filters: Pick<Filters, 'date' | 'start' | 'end'>) {
    return request<number[]>('/spaces/booked-ids', {
      method: 'POST',
      body: JSON.stringify(filtersToWindowIso(filters)),
    });
  },
  recommendations(filters: Filters) {
    return request<Recommendation[]>('/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        ...filtersToWindowIso(filters),
        space_type: filters.spaceType,
        attendee_count: filters.attendeeCount,
        required_equipment_ids: filters.requiredEquipmentIds,
        optional_equipment_ids: filters.optionalEquipmentIds,
        preferred_zone: filters.preferredZone || undefined,
      }),
    });
  },
  adminBookings: () => request<AdminBookingRow[]>('/admin/bookings'),
  adminCancelBooking: (id: number) => request<{ id: number; status: string }>(`/admin/bookings/${id}/cancel`, { method: 'POST' }),
  adminCreateFloor: (payload: { name: string; floor_number: number; description?: string }) =>
    request<OfficeFloor>('/admin/floors', { method: 'POST', body: JSON.stringify({ ...payload, is_active: true }) }),
  adminCreateSpace: (payload: {
    floor_id: number;
    name: string;
    type: SpaceType;
    zone: string;
    x_coordinate: number;
    y_coordinate: number;
    capacity: number;
    layout_local_id?: number;
    equipment_ids?: number[];
  }) => request<Space>('/admin/spaces', { method: 'POST', body: JSON.stringify({ ...payload, is_active: true, equipment_ids: payload.equipment_ids ?? [] }) }),
};
