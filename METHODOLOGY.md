# FirePulse: Scientific Harmonization & Analytics Methodology (Phase 5)

**Project Name**: FirePulse  
**Team**: Virtual Warriors  
**Challenge**: NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots  
**Revision Date**: November 14, 2026  

---

## 1. Problem Statement: Why Harmonization is Mandatory

NASA's **MODIS** (Moderate Resolution Imaging Spectroradiometer) on Terra and Aqua satellites has provided continuous daily active-fire monitoring since late 2000. The **VIIRS** (Visible Infrared Imaging Radiometer Suite) instrument on Suomi-NPP (2012–2026), NOAA-20 (2018+), and NOAA-21 (2023+) continues this observation legacy.

However, **raw observation counts from MODIS and VIIRS cannot be directly compared**:

1. **Spatial Footprint Disparity**:
   - MODIS nadir pixel resolution: **1,000 m** ($1.00\text{ km}^2$).
   - VIIRS I-band (375 m) nadir resolution: **375 m** ($\approx 0.14\text{ km}^2$).
   - The ground area of a single MODIS pixel is approximately **7.11 times larger** than a VIIRS 375m pixel. A single fire front spanning 1 km² produces 1 MODIS detection but up to 7–10 VIIRS detections.
2. **Scan Geometry & Pixel Growth**:
   - Towards the scan edge, MODIS pixels expand by up to 5x along-scan and 2x along-track (up to 10 km²).
   - VIIRS employs sample aggregation across three zones, limiting edge-of-scan pixel growth to approximately 2x (375 m to 750 m), avoiding the severe "bow-tie" distortion seen in MODIS.
3. **Diurnal Overpass Schedules**:
   - **Terra (MODIS)**: ~10:30 AM (descending) / ~10:30 PM (ascending) local solar time.
   - **Aqua (MODIS)**: ~01:30 PM (ascending) / ~01:30 AM (descending) local solar time.
   - **Suomi-NPP / NOAA-21 (VIIRS)**: ~01:30 PM (ascending) / ~01:30 AM (descending).
   - **NOAA-20 (VIIRS)**: ~12:45 PM (ascending) / ~12:45 AM (descending) — flies 50 minutes ahead of Suomi-NPP on the same orbital track.
4. **Saturation & Sensitivity**:
   - VIIRS I4 channel (3.9 µm) detects smaller and lower-intensity fires (FRP $\approx 0.5\text{–}1.0\text{ MW}$) that remain undetectable by MODIS Channel 21/22.

Treating raw counts as equivalent would create a **false artificial tripling of fire activity** during the 2012–2018 satellite transition era.

---

## 2. The 8-Step Harmonization Workflow

```
[Raw NASA FIRMS CSV/API]
          │
          ▼
┌─────────────────────────┐
│ 1. Provenance Ingestion │ Store raw records with source, satellite, confidence, FRP
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 2. Quality Filtering    │ Respect sensor-specific confidence schemas (Categorical vs %)
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 3. Projection Transform │ WGS84 (EPSG:4326) ➔ Equal-Area Cylindrical (EPSG:6933)
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 4. Deterministic Binning│ Assign discrete 1,000 m Equal-Area Grid Cell ID
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 5. Temporal Standardize │ UTC 24-Hour Calendar Day Window
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 6. Cross-Sensor Overlay │ Flag Co-Detections (MODIS + VIIRS within same cell-day)
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 7. Baseline Calibration │ Compute historical monthly medians & relative quantiles
└─────────┬───────────────┘
          │
          ▼
[Burning Activity Calendar & Analytical APIs]
```

---

## 3. Mathematical Formulation

### 3.1. Equal-Area Coordinate Projection (EPSG:6933)

Latitude $\phi$ and Longitude $\lambda$ in decimal degrees (WGS84, EPSG:4326) are projected into metric coordinates $(X, Y)$ using the standard authalic sphere ($R = 6,371,007.1809\text{ m}$):

$$X = R \cdot \lambda \cdot \frac{\pi}{180}$$

$$Y = R \cdot \frac{\sin(\phi)}{\cos(\phi_{std})}, \quad \text{where } \phi_{std} = 30^\circ$$

Because $\cos(30^\circ) = \frac{\sqrt{3}}{2} \approx 0.8660254$:

$$Y = \frac{R}{\cos(30^\circ)} \cdot \sin(\phi)$$

Every grid cell $(i, j)$ with nominal resolution $S = 1,000\text{ m}$ is deterministically assigned:

$$i = \left\lfloor \frac{X}{S} \right\rfloor, \quad j = \left\lfloor \frac{Y}{S} \right\rfloor$$

$$\text{grid\_cell\_id} = \text{"cell\_" } + i + \text{"\_"} + j$$

This guarantees that **every cell has identical $1.00\text{ km}^2$ ground surface area everywhere on Earth**, resolving the high-latitude latitude-longitude distortion of $0.01^\circ$ approximations.

---

### 3.2. Daily Cell Aggregation

For each analytical cell $c$ on UTC calendar date $d$:

$$N_{\text{MODIS}}(c, d) = \sum_{k \in \text{Obs}(c, d)} \mathbb{I}(\text{Sensor}_k = \text{MODIS})$$

$$N_{\text{VIIRS}}(c, d) = \sum_{k \in \text{Obs}(c, d)} \mathbb{I}(\text{Sensor}_k = \text{VIIRS})$$

$$\text{Active}(c, d) = \begin{cases} 1 & \text{if } N_{\text{MODIS}}(c, d) + N_{\text{VIIRS}}(c, d) \ge 1 \\ 0 & \text{otherwise} \end{cases}$$

$$\text{CoDetected}(c, d) = \begin{cases} 1 & \text{if } N_{\text{MODIS}}(c, d) \ge 1 \text{ and } N_{\text{VIIRS}}(c, d) \ge 1 \\ 0 & \text{otherwise} \end{cases}$$

---

### 3.3. Historical Median Baseline & Anomaly Metric

Burning patterns are strongly seasonal. Comparing a month against the annual average produces false winter/summer anomalies. FirePulse evaluates each month $m \in \{1, \dots, 12\}$ strictly against the historical observations for that identical calendar month:

$$\text{Baseline}(m) = \text{Median}\left( \{ A(y, m) \mid y \in Y_{\text{history}} \} \right)$$

$$\text{Anomaly Delta}(y, m) = A(y, m) - \text{Baseline}(m)$$

$$\text{Anomaly Ratio}(y, m) = \frac{A(y, m)}{\max(1, \text{Baseline}(m))}$$

A month is characterized as an **Unusual Anomaly** when:

$$\text{Anomaly Ratio}(y, m) \ge 1.50 \quad \text{and} \quad \text{Anomaly Delta}(y, m) \ge 5.0$$

---

## 4. Sensor Confidence Handling

- **MODIS**: Values are stored as percentage $[0, 100]\%$.
  - Low confidence: $< 30\%$
  - Nominal confidence: $30\% \le c \le 80\%$
  - High confidence: $> 80\%$
- **VIIRS**: Values are categorical: `l` (Low), `n` (Nominal), `h` (High).
  - Low confidence detections are attributed to sun glint, bright surfaces, or weak edge-of-scan thermal signatures.
  - Quality filters can exclude low-confidence detections without deleting the underlying raw record.

---

## 5. Scientific Caveats

1. **Hotspots $\neq$ Wildfire Incidents**: An active hotspot reflects a satellite thermal anomaly in an overpass window. Multiple hotspots may belong to a single large complex, and small agricultural burns may register as individual points.
2. **Active Cells $\neq$ Burned Area**: A 1km active cell denotes that active thermal radiative energy occurred within that 1km² footprint; it does not mean the entire 1km² surface was incinerated.
3. **Cloud & Smoke Obscuration**: Satellites cannot penetrate dense cloud decks or heavy pyrocumulus smoke columns; absence of detection does not prove absence of fire under persistent cloud cover.
4. **Suomi-NPP Transition**: NASA ceased standard data delivery for Suomi-NPP VIIRS on November 2, 2026. Ongoing operational observations are provided by NOAA-20 and NOAA-21.
