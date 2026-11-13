# FirePulse — Hackathon Demonstration & Evaluation Guide
**NASA Space Apps Challenge 2026 | Challenge: Harmonization of MODIS and VIIRS Hot Spots**  
**Team: Virtual Warriors**

---

## 🎯 1. Executive Summary for Judges

**FirePulse** is a scientific Earth observation web application that addresses one of remote sensing's most persistent challenges: **harmonizing active-fire hotspot detections across disparate satellite sensors without corrupting sensor integrity or double-counting fire events**.

Unlike superficial dashboards, FirePulse implements:
1. **Real NASA FIRMS Integration**: Direct connection to the official FIRMS Area API with automatic 5-day chunking, raw caching, and rate limiting.
2. **Geospatial Harmonization Engine**: Reprojection from WGS84 to **EPSG:6933 (Equal Area)** onto a standardized 1km $\times$ 1km analytical grid.
3. **UTC Standardization**: Zero-padded 24-hour UTC datetime normalization.
4. **Co-Detection Without False Conflation**: If MODIS and VIIRS observe the same 1km cell on the same UTC day, it is recorded as a **cross-sensor co-detected cell-day**—never counted as two separate fires, nor is either observation discarded.
5. **Burning Activity Calendar**: Heatmap with dynamic quantile distribution levels (not arbitrary thresholds) and deep single-day spatial inspection.
6. **Robust Anomaly Detection**: Median Absolute Deviation (MAD) & Robust Z-Scores with strict multi-year baseline safeguards.

---

## 🚀 2. Live Demo Presentation Flow (7–10 Minutes)

### Step 1: System Health & Security Overview
- Open **Settings & Ingestion** (`/settings`).
- Point out the **NASA FIRMS API Key status**: API keys are securely managed in backend environment variables (`backend/.env`), never exposed in browser bundles or client requests.
- Point out the **Database Connection**: SQLite initialized with SQLAlchemy repository pattern (readily replaceable with PostgreSQL/PostGIS).

### Step 2: Area of Interest (AOI) Selection
- Click the **AOI Selector pill** in the top navigation bar.
- Note the default preset: **Tamil Nadu, India** (`west: 76.2, south: 8.0, east: 80.4, north: 13.6`).
- Demonstrate switching between presets (e.g. California, USA) and custom coordinates.

### Step 3: Fetching Real NASA FIRMS Data
- On the **Dashboard** (`/dashboard`), click **"Fetch NASA FIRMS (Last 3 Days)"**.
- If a valid `FIRMS_MAP_KEY` is present: Watch the real-time query fetch `MODIS_NRT`, `VIIRS_NOAA20_NRT`, and `VIIRS_NOAA21_NRT` observations.
- If offline or testing historical data: Demonstrate the **Archive CSV Import tool** (`/settings`), uploading a NASA FIRMS CSV. Show the processing audit report tracking records received, accepted, rejected, and duplicates.

### Step 4: The Core Harmonization Engine
- Explain the scientific core:
  - MODIS nominal resolution is **1,000 m**; VIIRS nominal resolution is **375 m**.
  - Observations are projected to **EPSG:6933 Cylindrical Equal Area**.
  - Show the **Active Grid Cells** counter vs the raw observation counts.
  - Explain that **raw detections are NOT summed as fire counts**.

### Step 5: Interactive Fire Map
- Navigate to **Interactive Map** (`/fire-map`).
- Observe **MODIS hotspots (amber)** and **VIIRS hotspots (cyan)**.
- Toggle the **Show 1km Analytical Grid Cells** overlay: highlight how high-density VIIRS clusters fall inside the 1km equal-area grid boundaries.
- Click on an observation: Inspect acquisition time, FRP (MW), Brightness (K), satellite, and preserved confidence.

### Step 6: Burning Activity Calendar
- Navigate to **Burning Calendar** (`/calendar`).
- Explain the metric selector:
  1. Active 1km Grid Cells
  2. MODIS Observations
  3. VIIRS Observations
  4. Co-Detected Cell-Days
  5. Mean FRP
- Explain that calendar color levels (0 to 5) are generated using **empirical quintiles** calculated from the selected AOI's distribution, avoiding scientifically dishonest arbitrary thresholds.
- Click on an active day: View the side-panel granular breakdown showing active cell IDs, MODIS vs VIIRS counts, and individual hotspot locations.

### Step 7: Sensor Comparison & Historical Trends
- Navigate to **Sensor Comparison** (`/comparison`):
  - Review the side-by-side cards: MODIS 1,000m vs VIIRS 375m.
  - Inspect the **Common 1km Grid Overlap donut chart**: co-detected cell-days vs MODIS-only vs VIIRS-only.
- Navigate to **Historical Trends** (`/trends`):
  - Review the multi-year chart and monthly seasonality curve.
  - Highlight the **Sensor Eras panel**: explain the **Suomi-NPP cessation condition** (November 2, 2026) and why continuous uncalibrated historical series must not be created without documented calibration.

### Step 8: Statistical Anomaly Detection
- Navigate to **Unusual Activity** (`/insights`).
- Review the **Safeguard Status**: If less than 3 distinct years exist, show the safeguard message:
  > *"Insufficient historical data for reliable anomaly analysis."*
- If multi-year data is loaded: Demonstrate the MAD calculation, Robust Z-Score, and historical percentile ranking.

### Step 9: CSV Export & Scientific Transparency
- Click the **CSV** export button in the top header.
- Open the exported CSV: Verify normalized columns, acquisition timestamps, grid cell IDs, and sensor provenance.
- Review the **NASA Data Sources** tab (`/data-sources`): Note the official NASA EOSDIS LANCE attribution and documentation links.

---

## 📋 3. Scientific Disclaimers

1. **Research & Monitoring Tool**: FirePulse is designed for scientific inquiry and land management analysis. It is **not** a certified emergency alert or life-safety warning system.
2. **Thermal Anomaly Nature**: Hotspots indicate thermal anomalies and may occasionally include industrial gas flares or volcanic activity. Cloud obscuration or dense smoke may also prevent satellite detection.
3. **Attribution**: "Independent student project using NASA FIRMS data. Not an official NASA product."

