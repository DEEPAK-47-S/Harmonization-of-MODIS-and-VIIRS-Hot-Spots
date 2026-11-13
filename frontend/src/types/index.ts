export interface AOIBounds {
  name?: string;
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface Observation {
  id: number;
  observation_id: string;
  sensor_family: 'MODIS' | 'VIIRS';
  satellite: string;
  instrument: string;
  source_id: string;
  processing_type: string;
  latitude: number;
  longitude: number;
  grid_cell_id: string;
  acquisition_date_utc: string;
  acquisition_datetime_utc: string;
  daynight?: 'D' | 'N';
  brightness_temperature_kelvin?: number;
  brightness_channel?: string;
  frp_mw: number;
  confidence_raw: string;
  confidence_type: 'percentage' | 'categorical';
  scan_km?: number;
  track_km?: number;
  version?: string;
  ingested_at: string;
}

export interface GridCell {
  id: number;
  grid_cell_id: string;
  activity_date_utc: string;
  modis_detection_count: number;
  viirs_detection_count: number;
  total_detections: number;
  active_grid_cell: boolean;
  sensors_present: 'MODIS' | 'VIIRS' | 'MODIS+VIIRS';
  cross_sensor_presence: boolean;
  modis_frp_mean?: number;
  modis_frp_max?: number;
  viirs_frp_mean?: number;
  viirs_frp_max?: number;
  cell_center_lat: number;
  cell_center_lon: number;
  cell_bounds_wgs84?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

export interface DashboardSummary {
  kpi: {
    total_modis_observations: number;
    total_viirs_observations: number;
    total_observations: number;
    active_grid_cell_days: number;
    cross_sensor_co_detected_cell_days: number;
    latest_observation_utc?: string;
  };
  recent_timeline: Array<{
    date: string;
    active_grid_cells: number;
    modis_count: number;
    viirs_count: number;
    co_detected_cells: number;
  }>;
  latest_data_quality?: any;
  selected_aoi: AOIBounds;
}

export interface CalendarDayItem {
  date: string;
  active_grid_cells: number;
  modis_observations: number;
  viirs_observations: number;
  cross_sensor_co_detections: number;
  modis_mean_frp?: number;
  viirs_mean_frp?: number;
  mean_frp: number;
  metric_value: number;
  activity_level: number; // 0 to 5
}

export interface CalendarResponse {
  metric: string;
  year?: number;
  month?: number;
  total_active_days: number;
  thresholds: {
    level_1_min: number;
    level_2_min: number;
    level_3_min: number;
    level_4_min: number;
    level_5_min: number;
  };
  days: CalendarDayItem[];
}

export interface SensorComparisonData {
  modis: {
    observation_count: number;
    frp_mean: number;
    frp_max: number;
    satellites: string[];
    confidence_distribution: { low: number; nominal: number; high: number };
  };
  viirs: {
    observation_count: number;
    frp_mean: number;
    frp_max: number;
    satellites: string[];
    confidence_distribution: { low: number; nominal: number; high: number };
  };
  overlap: {
    total_active_cell_days: number;
    co_detected_cell_days: number;
    modis_only_cell_days: number;
    viirs_only_cell_days: number;
    co_detection_rate_pct: number;
  };
  timeline: Array<{
    date: string;
    modis_detections: number;
    viirs_detections: number;
    active_grid_cells: number;
    co_detected_cells: number;
  }>;
  scientific_notes: string[];
}

export interface AnomalyEvaluation {
  status: 'SUCCESS' | 'INSUFFICIENT_HISTORY' | 'NO_DATA';
  message: string;
  safeguards: {
    sufficient_history: boolean;
    distinct_years_count: number;
    required_years: number;
    sample_threshold: number;
  };
  total_evaluated_days: number;
  anomaly_count: number;
  anomalies: Array<{
    date_utc: string;
    observed_active_cells: number;
    historical_median: number;
    median_absolute_deviation: number;
    robust_z_score: number;
    historical_percentile: number;
    sample_size: number;
    distinct_years: number;
    reference_window: string;
    method: string;
    is_anomaly: boolean;
    explanation: string;
  }>;
  all_evaluated_days: any[];
}

