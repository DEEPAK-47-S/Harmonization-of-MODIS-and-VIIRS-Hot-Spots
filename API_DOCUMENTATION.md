# FirePulse: REST API Documentation (Phase 16)

Base URL: `http://localhost:5000/api`

---

## 1. System & Health

### `GET /health`
Returns health check and database connectivity.
- **Response**:
  ```json
  {
    "status": "online",
    "database_connected": true,
    "firms_map_key_configured": true,
    "total_observations_in_db": 12958
  }
  ```

### `GET /firms-status`
Returns transaction quota usage for the configured NASA FIRMS MAP_KEY.

---

## 2. Global Intelligence & Coverage

### `GET /global/summary`
Returns worldwide counts, continent breakdown, and top active countries.
- **Query Params**: `date_from`, `date_to`

### `GET /global/continents`
Returns list of continents with monitored bounding boxes and active fire counts.

### `GET /global/countries`
Returns Natural Earth countries list with ISO3 codes and coordinates.

### `GET /global/country/<iso3>/summary`
Returns country-specific KPIs, 14-day timeline, and top observation coordinates.

### `GET /global/map-density`
Zoom-dependent spatial aggregation for high-performance global map rendering.
- **Query Params**: `west`, `south`, `east`, `north`, `zoom`, `date_from`, `date_to`

### `GET /global/coverage`
Returns sensor operational matrix, database ingestion status, and Suomi-NPP cutoff details.

### `GET /global/timemachine`
Returns multi-day animation frames with geographical cluster densities for time-series playback.

---

## 3. Dashboard & Observations

### `GET /dashboard/summary`
Returns top-level KPIs, sensor breakdown bar data, and 14-day activity timeline for selected AOI.
- **Query Params**: `west`, `south`, `east`, `north`, `date_from`, `date_to`

### `GET /hotspots`
Returns filtered raw satellite observations and associated 1km grid cells.
- **Query Params**: `west`, `south`, `east`, `north`, `limit`, `include_grid`, `date_from`, `date_to`

---

## 4. Burning Activity Calendar

### `GET /calendar/matrix`
Returns the multi-year Year x Month heatmap matrix (Rows: Years, Columns: Jan-Dec) with historical monthly medians and anomaly indicators.
- **Query Params**: `metric` (`active_grid_cells`, `modis_observations`, `viirs_observations`, `cross_sensor_co_detections`, `mean_frp`), `west`, `south`, `east`, `north`

### `GET /calendar`
Returns quantile-binned daily calendar heatmap for a single month.
- **Query Params**: `year`, `month`, `metric`, `west`, `south`, `east`, `north`

### `GET /calendar/day`
Returns all 1km grid cells and individual satellite observations for a single UTC day.
- **Query Params**: `date` (`YYYY-MM-DD`), `west`, `south`, `east`, `north`

---

## 5. Analytics & Comparison

### `GET /comparison`
Returns comprehensive MODIS vs VIIRS comparison, detection ratios, confidence distributions, and scientific notes.

### `GET /global/comparison`
Returns comparative cross-country benchmark table with VIIRS/MODIS detection ratios.

### `GET /trends`
Returns yearly and monthly historical trends with sensor era demarcation.

### `GET /anomalies`
Returns detected historical anomalies using Median Absolute Deviation (MAD) relative to same-calendar-month baselines.

---

## 6. Ingestion & Export

### `POST /data/ingest/recent`
Fetches recent observations directly from NASA FIRMS API.
- **Body**: `{ "west": ..., "south": ..., "east": ..., "north": ..., "day_range": 3, "sources": [...] }`

### `POST /data/import/csv`
Uploads and validates downloaded NASA FIRMS Archive CSV files.

### `GET /export/observations`
Downloads CSV of filtered raw satellite observations.

### `GET /export/grid`
Downloads CSV of harmonized 1km analytical grid cells.
