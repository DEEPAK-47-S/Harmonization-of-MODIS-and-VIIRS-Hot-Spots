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

export const formatCoord = (val: number, isLat: boolean): string => {
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${Math.abs(val).toFixed(2)}°${dir}`;
};

export const formatAOIBounds = (aoi: AOIBounds): string => {
  return `${formatCoord(aoi.south, true)}–${formatCoord(aoi.north, true)}, ${formatCoord(aoi.west, false)}–${formatCoord(aoi.east, false)}`;
};

export interface ContinentItem {
  id?: string;
  key: string;
  name: string;
  code?: string;
  observations_count?: number;
  count?: number;
  active_cells_count?: number;
  mean_frp_mw?: number;
  bounds: [number, number, number, number] | { west: number; south: number; east: number; north: number };
}

export interface CountryItem {
  iso3: string;
  name: string;
  continent: string;
  center_lat?: number;
  center_lon?: number;
  center?: [number, number];
  bounds: [number, number, number, number] | { west: number; south: number; east: number; north: number };
  observations_count?: number;
  active_cells_count?: number;
}

export interface GlobalSummary {
  scope: string;
  kpi: {
    total_observations: number;
    modis_observations: number;
    viirs_observations: number;
    active_grid_cells: number;
    co_detected_cells: number;
    active_countries_count: number;
    active_continents_count: number;
    latest_observation_utc: string | null;
  };
  continents: ContinentItem[];
  top_countries: Array<{
    iso3: string;
    name: string;
    continent: string;
    observations_count: number;
    active_cells_count: number;
  }>;
}

export interface CountryAnalytics {
  country: {
    iso3: string;
    name: string;
    continent: string;
    center_lat: number;
    center_lon: number;
    bounds: [number, number, number, number] | { west: number; south: number; east: number; north: number };
  };
  kpi: {
    total_observations: number;
    modis_observations: number;
    viirs_observations: number;
    active_grid_cells: number;
    co_detected_cells: number;
    mean_frp_mw: number;
    max_frp_mw: number;
  };
  timeline: Array<{
    date: string;
    active_grid_cells: number;
    modis_count: number;
    viirs_count: number;
    co_detected_cells: number;
  }>;
  sensor_split: {
    modis: { count: number; mean_frp: number };
    viirs: { count: number; mean_frp: number };
  };
}

export interface MapDensityCluster {
  lat: number;
  lon: number;
  total_detections: number;
  modis_detections: number;
  viirs_detections: number;
  has_co_detection: boolean;
  mean_frp: number;
  point_count: number;
}

export interface MapDensityResponse {
  grid_step_deg: number;
  total_cells: number;
  clusters: MapDensityCluster[];
  sample_points: Observation[];
}

export interface TimeMachineFrame {
  date_utc: string;
  total_observations: number;
  modis_count: number;
  viirs_count: number;
  active_cells: number;
  top_continents: Array<{
    continent: string;
    count: number;
  }>;
  clusters: MapDensityCluster[];
}

export interface CoverageSource {
  source_id: string;
  sensor_family: string;
  satellite: string;
  processing_type: string;
  nominal_start: string;
  nominal_end: string;
  status: string;
  operational: boolean;
  notes: string;
}

export interface CoverageMatrix {
  generated_at_utc: string;
  sources: CoverageSource[];
  database_records: {
    total_observations: number;
    earliest_observation: string | null;
    latest_observation: string | null;
    modis_observations: number;
    viirs_observations: number;
    sensor_counts: Record<string, number>;
  };
  snpp_cessation_notice: {
    satellite: string;
    last_archive_date: string;
    notes: string;
  };
}


