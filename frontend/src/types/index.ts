export type RiskSeverity = 'green' | 'yellow' | 'orange' | 'red';

export interface FactorsBreakdown {
  rainfall_component: number;
  drainage_deficit_component: number;
  blockage_component: number;
  terrain_component: number;
  crowdsource_component: number;
}

export interface RiskAnalysisResult {
  risk_score: number;
  severity: RiskSeverity;
  risk_level: string;
  color: string;
  action_summary: string;
  effective_rainfall_mm_hr: number;
  nominal_drainage_capacity_mm_hr: number;
  effective_drainage_capacity_mm_hr: number;
  surplus_water_mm_hr: number;
  effective_blockage_pct: number;
  imperviousness_pct: number;
  slope_gradient_pct: number;
  factors_breakdown: FactorsBreakdown;
  explanations: string[];
  experimental_estimate: boolean;
  disclaimer: string;
}

export interface Street {
  id: number;
  name: string;
  city: string;
  ward_name: string;
  ward_no: string;
  latitude: number;
  longitude: number;
  road_type: string;
  surface_imperviousness: number;
  slope_gradient: number;
  length_meters: number;
  elevation_meters: number;
  catchment_area_sqm: number;
  baseline_risk: string;
  drainage?: DrainageRecord;
  rainfall?: RainfallReading;
  risk_analysis?: RiskAnalysisResult;
  computed_risk?: RiskAnalysisResult;
  citizen_reports_count?: number;
}

export interface DrainageRecord {
  id: number;
  street_id: number;
  drain_code: string;
  drain_type: string;
  nominal_capacity_mm_hr: number;
  current_blockage_pct: number;
  silt_depth_cm: number;
  structural_status: 'Good' | 'Fair' | 'Degraded' | 'Collapsed' | string;
  last_inspected: string;
  desilt_status: 'Recent' | 'Due' | 'Overdue' | 'In Progress' | string;
  maintenance_crew: string;
  discharge_outfall: string;
  street_name?: string;
  city?: string;
  ward_name?: string;
  ward_no?: string;
  latitude?: number;
  longitude?: number;
}

export interface RainfallReading {
  id: number;
  city: string;
  station_code: string;
  station_name: string;
  timestamp: string;
  current_intensity_mm_hr: number;
  accumulation_1h: number;
  accumulation_3h: number;
  accumulation_6h: number;
  accumulation_24h: number;
  forecast_next_2h_mm_hr: number;
  sensor_status: string;
  data_source: string;
}

export interface FloodAlert {
  id: number;
  alert_code: string;
  street_id: number;
  street_name: string;
  ward_name: string;
  city: string;
  severity: RiskSeverity;
  risk_score: number;
  title: string;
  message: string;
  recommendation: string;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Dispatched' | 'Resolved' | string;
  target_audience: string;
  deduplication_key: string;
}

export interface CitizenReport {
  id: number;
  report_code: string;
  street_name: string;
  ward_name: string;
  city: string;
  latitude: number;
  longitude: number;
  report_type: string;
  water_depth: string;
  description: string;
  citizen_name: string;
  phone_masked: string;
  photo_url?: string;
  upvotes: number;
  status: 'Under Verification' | 'Verified & Queued' | 'Crew Dispatched' | 'Cleared' | 'Rejected' | string;
  created_at: string;
  updated_at: string;
}

export interface MunicipalResponse {
  id: number;
  incident_code: string;
  street_id?: number;
  street_name: string;
  ward_name: string;
  city: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  assigned_team: string;
  crew_lead: string;
  pump_capacity_hp: number;
  dewatering_pumps_deployed: number;
  suction_vehicles_count: number;
  status: 'Pending' | 'Dispatched' | 'On-Site Dewatering' | 'Completed' | 'Closed' | string;
  dispatch_time: string;
  resolution_time?: string;
  resolution_notes?: string;
  verified_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  event_type: string;
  actor: string;
  role: string;
  description: string;
  ip_address: string;
  metadata_json?: string;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  category: string;
  updated_at: string;
}

export interface DashboardStats {
  total_monitored_streets: number;
  average_rainfall_mm_hr: number;
  max_rainfall_mm_hr: number;
  high_risk_locations_count: number;
  severe_risk_count: number;
  moderate_risk_count: number;
  low_risk_count: number;
  blocked_drains_count: number;
  active_alerts_count: number;
  recent_incidents: MunicipalResponse[];
  recent_citizen_reports: CitizenReport[];
  high_risk_spotlight: Street[];
  experimental_label: string;
}

export type UserRole = 'citizen' | 'ward_engineer' | 'eoc_chief' | 'admin';

export interface UserSession {
  role: UserRole;
  name: string;
  city: string;
  ward?: string;
  badgeNumber?: string;
}
