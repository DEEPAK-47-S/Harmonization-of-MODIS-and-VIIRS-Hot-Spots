# 🔥 FirePulse: Global MODIS and VIIRS Hot Spot Harmonization
**NASA Space Apps Challenge 2026**  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots  
**Team:** Virtual Warriors  
**Repository:** [https://github.com/DEEPAK-47-S/Harmonization-of-MODIS-and-VIIRS-Hot-Spots](https://github.com/DEEPAK-47-S/Harmonization-of-MODIS-and-VIIRS-Hot-Spots)  
**Project Classification:** Independent scientific Earth Observation project using NASA FIRMS data.

---

## 🛰️ 1. Project Overview & Challenge Objectives

**FirePulse** is a complete, scientifically credible, globally accessible Active Fire and Burning Activity Intelligence Platform. It directly addresses NASA's two challenge objectives:

1. **Objective 1 — Harmonize MODIS & VIIRS Hotspots**: Spatially and temporally aggregate satellite thermal observations from NASA MODIS (Terra/Aqua, 1,000m) and VIIRS (Suomi-NPP, NOAA-20, NOAA-21, 375m) onto a standardized **1km Cylindrical Equal-Area Grid (EPSG:6933)** in 24-hour UTC windows.
2. **Objective 2 — Interactive Burning Activity Calendar**: Deliver an intuitive multi-year burning activity calendar (Years × Months 1–12) with quantile-based baselines, historical median comparisons, and drilldown inspection of daily detections.

### Core Scientific Problem
- **Spatial Resolution Mismatch**: MODIS has a 1,000m nadir footprint; VIIRS has a 375m nadir footprint ($\approx 7.11\times$ smaller area). The same flame front generates far more VIIRS raw pixels than MODIS pixels.
- **Diurnal Overpass Variation**: Terra (~10:30 AM/PM), Aqua (~01:30 AM/PM), NOAA-20 (~12:45 PM), and NOAA-21 (~01:30 PM) sample the Earth at different points in the diurnal burn cycle.
- **Artificial Tripling Hazard**: Summing raw counts across the 2012–2018 sensor transition produces an artificial tripling of "fires" unless harmonized to equal ground surface area.
- **Suomi-NPP Cessation**: NASA ceased Suomi-NPP VIIRS data delivery on **November 2, 2026**. Ongoing monitoring relies on NOAA-20 and NOAA-21.

---

## 🌟 2. Platform Modules & Routes

| Module | Route | Key Capabilities |
|---|---|---|
| **Editorial Dashboard** | `/dashboard` | Command center with AOI selector, KPI metrics, interactive map, activity summary, timeline chart, and recent observations table. |
| **Global Explorer** | `/global-explorer` | Global overview across 7 continents, monitored countries, and country-specific fire intelligence summaries. |
| **Interactive Fire Map** | `/fire-map` | High-performance Leaflet map with ESRI Light/Dark/Satellite & OSM layers, density clusters, and 1km cell overlays. |
| **Burning Activity Calendar** | `/calendar` | **Signature Feature**: Dual-mode calendar with **Annual Heatmap (Years × Months)** and **Monthly Day-by-Day Grid** with historical medians. |
| **Global Time Machine** | `/time-machine` | Multi-day animated temporal playback of active burning clusters worldwide. |
| **Sensor Comparison** | `/comparison` | In-depth MODIS vs VIIRS comparison, detection ratios, confidence distributions, and remote sensing caveats. |
| **Country Benchmark** | `/country-comparison` | Comparative cross-country table analyzing satellite detection ratios and active burning density. |
| **Historical Trends** | `/trends` | Multi-year totals, Jan–Dec monthly seasonality curves, and sensor era demarcation. |
| **Unusual Activity** | `/insights` | Statistical anomaly detection using Median and MAD relative to same-calendar-month baselines. |
| **Coverage Matrix** | `/coverage` | Live status of supported NASA products, Suomi-NPP cessation cutoff, and database record stats. |
| **Data Sources** | `/data-sources` | NASA FIRMS documentation, LANCE attribution, and API capabilities. |
| **Methodology** | `/about` | Harmonization mathematics, EPSG:6933 projection details, and scientific validation. |
| **Settings & Ingestion** | `/settings` | Area of Interest selector, NASA FIRMS sync, and historical CSV archive uploader. |

---

## 📐 3. Harmonization Engine Summary

- **Equal-Area Projection**: Coordinates are converted from WGS84 (EPSG:4326) to **EPSG:6933 (World Cylindrical Equal Area)** using authalic radius $R = 6,371,007.18\text{ m}$ and $\phi_{std} = 30^\circ$.
- **Analytical Grid Assignment**: Each observation is assigned to a discrete 1km cell ID ($\lfloor X / 1000 \rfloor, \lfloor Y / 1000 \rfloor$).
- **Temporal Binning**: Daily UTC windows ensure cross-sensor observations on the same calendar day are co-registered.
- **Co-Detection Flagging**: Cells detected by both MODIS and VIIRS on the same UTC day receive `cross_sensor_presence = True` without merging or altering raw satellite records.

---

## 🛠️ 4. Quick Start Guide (Windows)

Double-click `start_servers.bat` or run:
```cmd
start_servers.bat
```
This automatically launches both servers:
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)

---

## 📚 5. Documentation Suite

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — Comprehensive technical audit of all modules, components, and fixes.
- [METHODOLOGY.md](METHODOLOGY.md) — Mathematical and remote sensing harmonization formulation.
- [NASA_DATA_SOURCES.md](NASA_DATA_SOURCES.md) — Supported sensors, satellites, products, and API endpoints.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — REST API specifications and request/response contracts.
- [TEST_REPORT.md](TEST_REPORT.md) — Pytest suite results (20/20 passing) and frontend build verification.
- [DEPLOYMENT.md](DEPLOYMENT.md) — Step-by-step local setup and production container deployment.

---

## 👥 6. Team Virtual Warriors
- **NASA Space Apps Challenge 2026**
- *Harmonization of MODIS and VIIRS Hot Spots*
