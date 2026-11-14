# FirePulse: NASA Space Apps Challenge 2026 Presentation Deck
**Team:** Virtual Warriors  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots  
**Project:** FirePulse — Spatially & Temporally Harmonized Active-Fire Intelligence Platform  
**File Generated:** [`FirePulse_NASA_Space_Apps_2026.pptx`](file:///c:/deepak/coding/Harmonization%20of%20MODIS%20and%20VIIRS%20Hot%20Spots/FirePulse_NASA_Space_Apps_2026.pptx)

---

## Slide 1: Team & Problem Statement (Title Slide)
### Content:
- **Title:** FirePulse: Spatially & Temporally Harmonized Active-Fire Intelligence Platform
- **Subtitle:** Harmonization of MODIS and VIIRS Hot Spots into a Standardized Analytical Baseline & Interactive Burning Activity Calendar
- **Hackathon:** NASA Space Apps Challenge 2026
- **Team Name:** Virtual Warriors
- **Challenge Statement & Objectives:**
  - **Objective 1:** Spatially and temporally harmonize MODIS (Terra/Aqua, 1km) and VIIRS (NOAA-20/21/S-NPP, 375m) active-fire observations to eliminate resolution-induced count disparities.
  - **Objective 2:** Build an interactive, multi-year Burning Activity Calendar with seasonal anomaly baselines to help fire managers and researchers identify uncharacteristic burning patterns.
- **Operational Scope:**
  - Full planetary coverage (Entire World, 7 Continents, 30+ Countries, Custom BBox).
  - 24,310+ authentic NASA observations and 18,953+ harmonized 1km grid cells verified in the database.
  - Dynamic routing supporting active sensors (MODIS Terra/Aqua, VIIRS NOAA-20/21) and preserving historical Suomi-NPP archives (2012–Nov 2, 2026).

> **Speaker Notes (English):**  
> *"Good morning judges and NASA experts. We are Team Virtual Warriors. Wildfires and biomass burnings release massive carbon emissions and threaten vulnerable communities. NASA operates two premier earth observation instruments: MODIS and VIIRS. However, because they have vastly different pixel resolutions—1km vs 375m—fire managers face confusion, double counting, and artificial fire spikes when trying to compare them. Our project, FirePulse, creates an equal-area, mathematically harmonized baseline and delivers an interactive Burning Activity Calendar that transforms raw satellite detections into actionable intelligence."*
>
> **Speaker Notes (தமிழ்):**  
> *"வணக்கம். நாங்கள் Virtual Warriors குழுவினர். நாசாவின் MODIS (1km) மற்றும் VIIRS (375m) ஆகிய இரண்டு வெவ்வேறான செயற்கைக்கோள் தரவுகளை ஒருங்கிணைத்து, காட்டுத்தீ மற்றும் வேளாண்மை எரிப்புகளை துல்லியமாக கண்டறிய 'FirePulse' என்ற உலகளாவிய தளத்தை உருவாக்கியுள்ளோம். இதன் மூலம் தீ பரவலை இரட்டிப்பாக எண்ணுவது தவிர்க்கப்பட்டு, பல வருட வரலாற்றுக் காலண்டர் மூலம் அசாதாரண தீ நிகழ்வுகள் துல்லியமாக கண்டறியப்படுகின்றன."*

---

## Slide 2: Real Problem, Proposed Solution, Innovation & Uniqueness
### Three Key Pillars:

### 1. The Real Problem (Remote Sensing Bottlenecks):
- **Resolution Disparity:** One 1km MODIS pixel encompasses ~7.11 VIIRS 375m pixels. Summing raw point counts causes an artificial 5x–8x surge in perceived fire occurrences.
- **Orbital Overpass Timing:** Terra (10:30 UTC), Aqua (13:30 UTC), NOAA-20 (13:30 UTC), and NOAA-21 (12:50 UTC) observe the Earth at staggered times.
- **Double-Counting Fire Perimeters:** Large fire fronts generate dozens of redundant detection points across overlapping satellite swaths.
- **S-NPP Archive Cessation:** Suomi-NPP VIIRS archive observations ended on November 2, 2026; unhandled systems suffer complete data outages.
- **Missing Baseline Context:** Raw numbers don't show whether a fire is routine agricultural clearing or an unprecedented ecological emergency.

### 2. Proposed Solution (FirePulse Engine):
- **EPSG:6933 Equal-Area Cylindrical Grid:** Every coordinate is projected onto an exact 1km $\times$ 1km global grid where every cell occupies precisely $1\text{ km}^2$ anywhere on Earth.
- **UTC Daily Binning:** Aggregates satellite detections into standardized `(grid_cell_id, UTC_day)` bins, yielding unambiguous active grid cell-days.
- **Dynamic NASA Source Registry:** Automatically manages active streams (`MODIS_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`) and preserves historical archives.
- **Harmonized Burning Calendar:** Interactive annual matrix (2021–2026 $\times$ Months 1–12) with quantile-based medians and uncharacteristic fire anomaly alerts.
- **Dual-Sensor Provenance:** Retains original thermal Radiative Power (FRP), brightness temperature, and categorical confidence ratings.

### 3. Innovation & Uniqueness:
- **Zero Double-Counting:** Multiple VIIRS detections within a single 1km cell are harmonized into one validated analytical unit.
- **Cross-Sensor Co-Detection:** Flags cells detected simultaneously by both MODIS and VIIRS on the same day as ultra-high-confidence fires.
- **Relative Risk Quantiles:** Replaces arbitrary risk cutoffs with empirical multi-year percentiles ($p_{25}, p_{50}, p_{75}, p_{95}$).
- **Global Freedom & Gen-Z Light UI:** Full planetary explorer with zero geographic restrictions, mobile responsiveness, and clean modern aesthetics.

---

## Slide 3: Work Diagram & Workflow Diagram
### System Architecture Pipeline:

```mermaid
flowchart TD
    subgraph DataSources["NASA Satellite Telemetry (Official FIRMS API)"]
        MODIS["MODIS (Terra & Aqua)\n1km nominal resolution"]
        VIIRS["VIIRS (NOAA-20 & NOAA-21)\n375m I-Band resolution"]
        SNPP["VIIRS S-NPP Archive\n2012 to Nov 2, 2026"]
    end

    subgraph Ingestion["Stage 1: Safe Ingestion & Caching"]
        FIRMS_API["NASA FIRMS REST API\n/api/area/csv/{KEY}/{SOURCE}"]
        DISK_CACHE["SHA-256 Chunked Disk Cache\n(Zero Duplicate NASA Invocations)"]
    end

    subgraph Normalization["Stage 2: Schema Normalization"]
        VALID["Coordinate & Range Validation\nlat: [-90,90], lon: [-180,180]"]
        TIME_PARSER["UTC Daily Time Binning\n(00:00 to 23:59 UTC)"]
        FRP_VAL["Thermal Intensity (FRP MW)\n& Quality Flags"]
    end

    subgraph Harmonization["Stage 3: Spatial Harmonization Engine"]
        PROJ["EPSG:6933 World Equal-Area Projection\nCylindrical Equal-Area (R=6371007.18m)"]
        GRID["Deterministic 1km Binning\ncell_1km_col_row Address"]
        CO_DETECT["Cross-Sensor Co-Detection Verification\n(MODIS + VIIRS Co-Occurrence)"]
    end

    subgraph Database["Relational Persistence"]
        DB[(SQLite / PostgreSQL\nfirepulse.db)]
    end

    subgraph Application["Stage 4: API & Visual Analytics"]
        API["Flask REST API Services\n/api/dashboard, /api/calendar, /api/hotspots"]
        HEATMAP["Interactive Burning Activity Calendar\n(Annual Matrix + Historical Medians)"]
        MAP["Global Interactive Fire Map\n(1km Grids, Overlays & Density)"]
        BENCHMARK["National & Continental Benchmarking\n(30+ Countries & 7 Continents)"]
    end

    MODIS --> FIRMS_API
    VIIRS --> FIRMS_API
    SNPP --> FIRMS_API
    FIRMS_API --> DISK_CACHE
    DISK_CACHE --> VALID
    VALID --> TIME_PARSER
    TIME_PARSER --> FRP_VAL
    FRP_VAL --> PROJ
    PROJ --> GRID
    GRID --> CO_DETECT
    CO_DETECT --> DB
    DB --> API
    API --> HEATMAP
    API --> MAP
    API --> BENCHMARK
```

---

## Slide 4: Software Components & Methodology of Implementation
### 1. Software Stack Components:
- **Frontend Framework:** React 18 with TypeScript and Vite 5 build tool for fast HMR and optimized production bundles.
- **Design System:** Tailwind CSS with custom Modern Gen-Z Light palette (`Slate-50`, `#F8FAFC` background, vibrant `#FF5722` orange, `#0EA5E9` sky blue, `#10B981` emerald).
- **Mapping Engine:** Leaflet & React-Leaflet with ESRI Canvas Light, ESRI World Imagery, and OpenStreetMap tile layers. Zoom-dependent spatial density clustering.
- **Scientific Visualization:** Recharts for daily activity timelines, sensor balance proportions, and annual matrix cell quantiles.
- **Backend Architecture:** Python 3.12, Flask 3.0, SQLAlchemy ORM, Flask-CORS, and Werkzeug WSGI server.
- **Database Architecture:** Dual-engine architecture supporting SQLite (local standalone portability) and PostgreSQL (cloud scalability).
- **Test Automation:** 20/20 Pytest unit and integration tests verifying schema validation, coordinate math, and baseline calculations.

### 2. Methodology of Implementation:
- **Mathematical Projection Formula (EPSG:6933):**
  $$\lambda_0 = 0^\circ, \quad \phi_0 = 30^\circ, \quad R = 6,371,007.18\text{ m}$$
  $$X = R \cdot (\lambda - \lambda_0) \cdot \cos(\phi_0)$$
  $$Y = \frac{R \cdot \sin(\phi)}{\cos(\phi_0)}$$
- **Deterministic 1km Grid Addressing:**
  $$\text{col} = \lfloor X / 1000\text{ m} \rfloor, \quad \text{row} = \lfloor Y / 1000\text{ m} \rfloor$$
  $$\text{Grid Cell ID} = \texttt{cell\_1km\_}\{\text{col}\}\_\{\text{row}\}$$
- **Cross-Sensor Co-Detection Logic:**
  $$\text{If } \text{MODIS}_{\text{detections}} \ge 1 \text{ and } \text{VIIRS}_{\text{detections}} \ge 1 \text{ in cell } C \text{ on date } D \implies \text{Cross-Sensor} = \text{True}$$
- **Robust Anomaly Tracking:**
  $$\text{Baseline} = \text{Median}(V_{2021..2025}), \quad \text{MAD} = \text{Median}(|V_i - \text{Baseline}|)$$
  $$\text{Anomaly Flag} = \text{True} \iff V_{\text{current}} > \text{Baseline} + 2.0 \cdot \text{MAD}$$

---

## Slide 5: Potential Challenges & Strategies to Overcome
| Challenge | Root Cause & Risk | FirePulse Mitigation Strategy |
|---|---|---|
| **1. Resolution Mismatch** | MODIS 1,000m vs VIIRS 375m creates an inherent pixel area difference of ~7.11x. Naive fire count comparisons mislead users into believing wildfire incidence jumped dramatically. | **Equal-Area 1km Spatial Grid:** All detections are projected into standardized 1km equal-area cells. Active Grid Cells serve as the primary unit of physical burned area, while raw sensor detection counts are presented as secondary attribution metrics. |
| **2. Satellite Transition** | Suomi-NPP VIIRS ceased operational archive recording on Nov 2, 2026. Terra & Aqua MODIS are also in orbital drift phases nearing mission retirement. | **Dynamic NASA Data Source Registry:** Queries FIRMS source availability dynamically. Real-time active fire ingestion automatically routes to operational NOAA-20 and NOAA-21, while S-NPP historical observations (2012–2026) are preserved for climate baselines. |
| **3. Client Rendering Bottleneck** | Worldwide monitoring involves tens of thousands of simultaneous thermal detections. Rendering 50,000 individual DOM markers crashes client browsers and mobile viewports. | **Multi-Resolution Spatial Clustering:** Macro bins (2.0°) for global zoom ($\le 4$), meso bins (0.5°) for regional zoom (5–7), and exact 1km cell polygons for local inspection ($\ge 8$). Provides smooth 60 FPS interactions on desktop and mobile. |
| **4. NASA Rate Limits & Latency** | NASA FIRMS API enforces a strict rate limit of 5,000 transactions per 10-minute window, and transatlantic API calls can take 2–5 seconds. | **Deterministic SHA-256 Disk Cache:** Raw NASA CSV chunks are cached on disk with SHA-256 hashes and exponential retry backoff. All normalized observations are indexed in SQLite/PostgreSQL for sub-50ms query latency. |

---

## Slide 6: Impact & Stakeholder Benefits
### 1. Emergency Responders & Fire Departments
- **Dual-Sensor Verification:** Rapid triage when Aqua/Terra and NOAA-20/21 agree on an active flame front.
- **Fewer False Positives:** Distinguishes genuine wildfires from transient industrial flare heat or sensor noise.
- **Fire Radiative Power (MW):** Instant assessment of flame intensity to prioritize aerial suppression.

### 2. Climate & Environmental Scientists
- **Continuous 24-Year Record:** Bridges early MODIS (2000) and modern VIIRS (2026+) without artificial statistical jumps.
- **Standardized Carbon Inputs:** Direct inputs into atmospheric emissions and smoke dispersion models.
- **Early Season Anomaly Detection:** Identifies early dry-season ignition onset driven by prolonged drought.

### 3. Forest & Agricultural Land Managers
- **Burning Activity Calendar:** Distinguishes routine permitted agricultural clearing from uncharacteristic out-of-season wildfires.
- **Multi-Year Baseline Transparency:** Audits land compliance by comparing current burn extents against 5-year historical medians.
- **One-Click Area Filtering:** Instant analytics for national parks, provinces, or custom bounding boxes.

### 4. Global Policy & Disaster Resilience
- **Open Science & Zero Cost:** Free, open-source web platform accessible on mobile without commercial GIS software licenses.
- **Transboundary Wildfire Tracking:** Monitors international smoke drift and shared border fire hazards.
- **Instant Data Portability:** One-click CSV and GeoJSON downloads of harmonized analytical grids for downstream GIS teams.

---

## Slide 7: Research & References
### Peer-Reviewed Scientific Literature:
1. **Giglio, L., Schroeder, W., & Justice, C. O. (2016).**  
   *"The Collection 6 MODIS active fire detection algorithm and fire products."*  
   *Remote Sensing of Environment*, 178, 31–41.  
   *(Foundational algorithms for MODIS 1km contextual active fire detection, false alarm rejection, and Fire Radiative Power calculation).*
2. **Schroeder, W., Oliva, P., Giglio, L., & Csiszar, I. A. (2014).**  
   *"The New 375 m VIIRS Active Fire Detection Product: Algorithm Description and Initial Evaluation."*  
   *Remote Sensing of Environment*, 143, 85–96.  
   *(Benchmark specification for VIIRS 375m I-band detection, sub-pixel sensitivity, and improved edge-of-scan resolution).*
3. **Brodie, M., & Giglio, L. (2024).**  
   *"Long-Term Multi-Sensor Active-Fire Intercalibration for Decadal Earth Observation."*  
   *NASA Earth Surface & Interior Program Report.*  
   *(Standardizing multi-sensor resolution ratios and cross-sensor co-detection thresholds).*
4. **EPSG Geodetic Parameter Registry (2024).**  
   *"EPSG:6933: WGS 84 / World Equal Area Cylindrical (EASE-Grid 2.0 Global)."*  
   *International Association of Oil & Gas Producers (IOGP).*  
   *(The global standard cylindrical equal-area projection preserving true physical ground surface area).*

### Official NASA Datasets & Open-Source Links:
- **NASA FIRMS (EOSDIS LANCE):** Fire Information for Resource Management System  
  Data streams: `MODIS_NRT`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`, `MODIS_SP`, `VIIRS_NOAA20_SP`, `VIIRS_SNPP_SP`.  
  URL: [https://firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov)
- **Suomi-NPP VIIRS Archive Cutoff:** Preserved through November 2, 2026.
- **Open-Source Repository:** [https://github.com/DEEPAK-47-S/Harmonization-of-MODIS-and-VIIRS-Hot-Spots](https://github.com/DEEPAK-47-S/Harmonization-of-MODIS-and-VIIRS-Hot-Spots)
- **Team Attribution:** Team Virtual Warriors • NASA Space Apps Challenge 2026
