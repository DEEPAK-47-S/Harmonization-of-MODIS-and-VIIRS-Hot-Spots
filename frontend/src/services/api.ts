import axios from 'axios';
import { 
  AOIBounds, 
  DashboardSummary, 
  Observation, 
  GridCell, 
  CalendarResponse, 
  SensorComparisonData, 
  AnomalyEvaluation 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const FirePulseAPI = {
  // System Health
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Sources and Status
  getSources: async () => {
    const res = await api.get('/data/sources');
    return res.data;
  },

  getAvailability: async () => {
    const res = await api.get('/data/availability');
    return res.data;
  },

  getFirmsStatus: async () => {
    const res = await api.get('/data/firms-status');
    return res.data;
  },

  // Ingestion
  ingestRecent: async (payload: {
    sources?: string[];
    west?: number;
    south?: number;
    east?: number;
    north?: number;
    day_range?: number;
    date_str?: string;
    aoi_name?: string;
  }) => {
    const res = await api.post('/data/ingest/recent', payload);
    return res.data;
  },

  ingestHistorical: async (payload: {
    source: string;
    start_date: string;
    end_date: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
    aoi_name?: string;
  }) => {
    const res = await api.post('/data/ingest/historical', payload);
    return res.data;
  },

  importArchiveCSV: async (file: File, sourceHint: string = 'ARCHIVE_UPLOAD') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_hint', sourceHint);
    const res = await api.post('/data/import/archive', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Dashboard Summary
  getDashboardSummary: async (aoi?: AOIBounds, dateFrom?: string, dateTo?: string): Promise<DashboardSummary> => {
    const params: any = {};
    if (aoi) {
      params.west = aoi.west;
      params.south = aoi.south;
      params.east = aoi.east;
      params.north = aoi.north;
    }
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const res = await api.get<DashboardSummary>('/dashboard/summary', { params });
    return res.data;
  },

  // Hotspots for Map
  getHotspots: async (params?: {
    west?: number;
    south?: number;
    east?: number;
    north?: number;
    date_from?: string;
    date_to?: string;
    sensor?: string;
    min_frp?: number;
    limit?: number;
    include_grid?: boolean;
  }): Promise<{ total_matching: number; returned_count: number; hotspots: Observation[]; grid_cells: GridCell[] }> => {
    const res = await api.get('/hotspots', { params });
    return res.data;
  },

  // Calendar
  getCalendar: async (params?: {
    year?: number;
    month?: number;
    metric?: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
  }): Promise<CalendarResponse> => {
    const res = await api.get<CalendarResponse>('/calendar', { params });
    return res.data;
  },

  getCalendarDay: async (dateStr: string, aoi?: AOIBounds) => {
    const params: any = { date: dateStr };
    if (aoi) {
      params.west = aoi.west;
      params.south = aoi.south;
      params.east = aoi.east;
      params.north = aoi.north;
    }
    const res = await api.get('/calendar/day', { params });
    return res.data;
  },

  // Comparison
  getComparison: async (params?: {
    date_from?: string;
    date_to?: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
  }): Promise<SensorComparisonData> => {
    const res = await api.get<SensorComparisonData>('/comparison', { params });
    return res.data;
  },

  // Trends
  getTrends: async (params?: {
    series_type?: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
  }) => {
    const res = await api.get('/trends', { params });
    return res.data;
  },

  // Anomalies
  getAnomalies: async (params?: {
    date_from?: string;
    date_to?: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
    percentile?: number;
    z_score?: number;
  }): Promise<AnomalyEvaluation> => {
    const res = await api.get<AnomalyEvaluation>('/anomalies', { params });
    return res.data;
  },

  // Data Quality
  getDataQuality: async () => {
    const res = await api.get('/data-quality');
    return res.data;
  },

  // Export URL builder
  getExportUrl: (type: 'observations' | 'grid', params?: {
    date_from?: string;
    date_to?: string;
    sensor?: string;
    west?: number;
    south?: number;
    east?: number;
    north?: number;
  }) => {
    const query = new URLSearchParams({ type });
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.sensor) query.append('sensor', params.sensor);
    if (params?.west !== undefined) query.append('west', params.west.toString());
    if (params?.south !== undefined) query.append('south', params.south.toString());
    if (params?.east !== undefined) query.append('east', params.east.toString());
    if (params?.north !== undefined) query.append('north', params.north.toString());
    return `/api/export/csv?${query.toString()}`;
  }
};

