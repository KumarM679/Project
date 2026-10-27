import {
  DashboardStats,
  Street,
  DrainageRecord,
  RainfallReading,
  FloodAlert,
  CitizenReport,
  MunicipalResponse,
  ActivityLog,
  SystemSetting
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errObj = await response.json();
      if (errObj && errObj.error) errMsg = errObj.error;
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; service: string; version: string }>(`${API_BASE}/health`),

  // Dashboard
  getDashboardStats: (city?: string) =>
    fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  // Streets & Risk Analysis
  getStreets: (params?: { city?: string; search?: string; risk?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.search) q.set('search', params.search);
    if (params?.risk) q.set('risk', params.risk);
    return fetchJson<{ streets: Street[]; count: number; disclaimer: string }>(`${API_BASE}/streets?${q.toString()}`);
  },

  getStreetDetail: (streetId: number) =>
    fetchJson<{
      street: Street;
      drainage: DrainageRecord;
      rainfall: RainfallReading;
      risk_analysis: Street['risk_analysis'];
      citizen_reports: CitizenReport[];
      alerts: FloodAlert[];
      municipal_responses: MunicipalResponse[];
    }>(`${API_BASE}/streets/${streetId}`),

  // Rainfall
  getRainfall: (city?: string) =>
    fetchJson<{
      readings: RainfallReading[];
      hourly_trends: { time: string; intensity_mm_hr: number; is_forecast: boolean }[];
      summary: { total_stations: number; max_intensity: number; max_station: string };
      disclaimer: string;
    }>(`${API_BASE}/rainfall${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  // Drainage CRUD
  getDrainage: (params?: { city?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return fetchJson<{ drainage_records: DrainageRecord[]; count: number }>(`${API_BASE}/drainage?${q.toString()}`);
  },

  createDrainage: (data: Partial<DrainageRecord>) =>
    fetchJson<{ message: string; id: number }>(`${API_BASE}/drainage`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDrainage: (id: number, data: Partial<DrainageRecord>) =>
    fetchJson<{ message: string }>(`${API_BASE}/drainage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDrainage: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/drainage/${id}`, {
      method: 'DELETE',
    }),

  // Alerts
  getAlerts: (params?: { city?: string; severity?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.severity) q.set('severity', params.severity);
    if (params?.status) q.set('status', params.status);
    return fetchJson<{ alerts: FloodAlert[]; count: number }>(`${API_BASE}/alerts?${q.toString()}`);
  },

  generateAlerts: () =>
    fetchJson<{ message: string; new_alerts_count: number; generated_codes: string[] }>(`${API_BASE}/alerts/generate`, {
      method: 'POST',
    }),

  updateAlertStatus: (alertId: number, status: string) =>
    fetchJson<{ message: string }>(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Citizen Reports
  getCitizenReports: (params?: { city?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.status) q.set('status', params.status);
    return fetchJson<{ reports: CitizenReport[]; count: number }>(`${API_BASE}/citizen-reports?${q.toString()}`);
  },

  submitCitizenReport: (data: Partial<CitizenReport>) =>
    fetchJson<{ message: string; report_code: string; id: number }>(`${API_BASE}/citizen-reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  upvoteCitizenReport: (reportId: number) =>
    fetchJson<{ message: string; upvotes: number }>(`${API_BASE}/citizen-reports/${reportId}/upvote`, {
      method: 'POST',
    }),

  updateReportStatus: (reportId: number, status: string) =>
    fetchJson<{ message: string }>(`${API_BASE}/citizen-reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Municipal Responses
  getMunicipalResponses: (params?: { city?: string; priority?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.status) q.set('status', params.status);
    return fetchJson<{ responses: MunicipalResponse[]; count: number }>(`${API_BASE}/municipal-response?${q.toString()}`);
  },

  createMunicipalResponse: (data: Partial<MunicipalResponse>) =>
    fetchJson<{ message: string; incident_code: string }>(`${API_BASE}/municipal-response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMunicipalResponse: (id: number, data: Partial<MunicipalResponse>) =>
    fetchJson<{ message: string }>(`${API_BASE}/municipal-response/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Analytics
  getAnalytics: () =>
    fetchJson<{
      city_stats: any[];
      drainage_distribution: any[];
      worst_bottlenecks: any[];
      incident_priority_stats: any[];
      historical_hotspots: any[];
      disclaimer: string;
    }>(`${API_BASE}/analytics`),

  // Activity Logs
  getActivityLogs: (limit = 60) =>
    fetchJson<{ logs: ActivityLog[]; count: number }>(`${API_BASE}/activity-logs?limit=${limit}`),

  // Settings
  getSettings: () => fetchJson<{ settings: SystemSetting[] }>(`${API_BASE}/settings`),

  updateSettings: (data: Record<string, any>) =>
    fetchJson<{ message: string }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Simulation Scenarios
  applyScenario: (scenario: 'dry' | 'moderate_shower' | 'monsoon_heavy' | 'cloudburst') =>
    fetchJson<{ message: string; scenario: string; description: string }>(`${API_BASE}/simulation/apply-scenario`, {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
};
