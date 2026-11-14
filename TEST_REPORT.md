# FirePulse: Automated Test Report (Phase 14 & 16)

**Challenge**: NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots  
**Team**: Virtual Warriors  
**Date**: November 14, 2026  
**Test Suite**: Python 3.12 / Pytest 9.2.0 & TypeScript 5.5 / Vite 5.4  

---

## 1. Backend Test Results

Total Tests Executed: **20**  
Passed: **20 (100%)**  
Failed: **0**  
Execution Time: **2.40s**  

| Test File | Test Case | Purpose | Result |
|---|---|---|---|
| `test_normalization.py` | `test_1_modis_column_normalization` | Verifies MODIS CSV column mapping and confidence translation | **PASSED** |
| `test_normalization.py` | `test_2_viirs_column_normalization` | Verifies VIIRS CSV column mapping and categorical confidence | **PASSED** |
| `test_normalization.py` | `test_3_utc_date_and_time_parsing` | Verifies UTC ISO timestamp parsing from separate date/time fields | **PASSED** |
| `test_normalization.py` | `test_4_missing_field_handling` | Ensures missing scan/track/daynight fields handle gracefully | **PASSED** |
| `test_normalization.py` | `test_5_invalid_latitude_longitude_rejection` | Validates rejection of out-of-bounds coordinates (lat $\notin [-90, 90]$) | **PASSED** |
| `test_normalization.py` | `test_6_frp_validation` | Validates rejection of negative FRP values | **PASSED** |
| `test_harmonization.py` | `test_7_deterministic_grid_cell_assignment` | Verifies EPSG:6933 deterministic grid cell calculation | **PASSED** |
| `test_harmonization.py` | `test_8_and_9_same_cell_aggregation_and_cross_sensor_presence` | Tests cross-sensor co-detection flagging for MODIS + VIIRS | **PASSED** |
| `test_normalization.py` | `test_10_raw_record_duplicate_prevention` | Tests SHA-256 fingerprint deduplication | **PASSED** |
| `test_calendar.py` | `test_11_calendar_calculations` | Verifies dynamic relative quantile thresholds for calendar days | **PASSED** |
| `test_anomalies.py` | `test_12_historical_baseline_calculations` | Tests historical median and anomaly scoring | **PASSED** |
| `test_anomalies.py` | `test_13_insufficient_history_safeguard` | Ensures safeguard when historical sample size is too small | **PASSED** |
| `test_export.py` | `test_14_csv_export` | Verifies CSV structure, headers, and RFC 4180 compatibility | **PASSED** |
| `test_firms_client.py` | `test_missing_map_key_error` | Verifies error handling when MAP_KEY is not configured | **PASSED** |
| `test_firms_client.py` | `test_invalid_aoi_handling` | Tests rejection of invalid bounding box geometries | **PASSED** |
| `test_firms_client.py` | `test_invalid_day_range_handling` | Enforces 1–5 day range constraints per FIRMS API rules | **PASSED** |
| `test_firms_client.py` | `test_date_range_chunking` | Verifies automatic date splitting into <= 5-day chunks | **PASSED** |
| `test_firms_client.py` | `test_csv_parser_empty_and_no_data` | Handles empty response and "NO_DATA" strings from FIRMS | **PASSED** |
| `test_global.py` | `test_continents_and_countries_dataset` | Validates all 7 continents and 20+ countries dataset | **PASSED** |
| `test_global.py` | `test_global_endpoints` | End-to-end test of `/global/continents`, `/summary`, `/coverage`, `/map-density` | **PASSED** |

---

## 2. Frontend Build & Type Validation

Command: `npm --prefix frontend run build`
- **TypeScript Compiler**: `tsc -b` (Exit Code 0, 0 type errors).
- **Vite Production Bundler**: `vite build` completed in **11.25s**.
- **Assets Output**:
  - `dist/index.html` (1.56 kB)
  - `dist/assets/index-*.css` (30.5 kB)
  - `dist/assets/index-*.js` (1,013 kB)
- **Status**: **PASSED**
