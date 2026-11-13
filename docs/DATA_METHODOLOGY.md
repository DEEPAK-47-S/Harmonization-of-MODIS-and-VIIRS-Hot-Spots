# FirePulse — Data Methodology & Harmonization Principles
**NASA Space Apps Challenge 2026 | Challenge: Harmonization of MODIS and VIIRS Hot Spots**  
**Team: Virtual Warriors**

---

## 1. The Challenge of Satellite Fire Harmonization

NASA FIRMS distributes active-fire hotspot products derived from two fundamental sensor families:
1. **MODIS (Moderate Resolution Imaging Spectroradiometer)**: Flying on NASA's Terra and Aqua satellites since 2000 and 2002. Nominal spatial resolution is **1,000 m (1 km)** at nadir in thermal bands (T21/T22 and T31).
2. **VIIRS (Visible Infrared Imaging Radiometer Suite)**: Flying on Suomi-NPP (2012–2026), NOAA-20 / JPSS-1 (2018–present), and NOAA-21 / JPSS-2 (2023–present). Nominal spatial resolution is **375 m** at nadir in imagery bands (I4 and I5).

### Fundamental Sensor Differences:
- **Spatial Resolution**: A single MODIS 1 km pixel covers approximately the same geographic area as seven VIIRS 375 m pixels ($\approx 7.1 \times$ area difference). VIIRS can resolve smaller, lower-intensity fires and fragmented burns that fall below MODIS detection limits.
- **Equatorial Crossing Times**:
  - Terra: $\sim$10:30 AM (descending) / 10:30 PM (ascending)
  - Aqua: $\sim$01:30 PM (ascending) / 01:30 AM (descending)
  - Suomi-NPP: $\sim$01:30 PM (ascending) / 01:30 AM (descending)
  - NOAA-20: $\sim$12:45 PM (half an orbit offset from Suomi-NPP)
  - NOAA-21: $\sim$01:30 PM (flying adjacent to Suomi-NPP)
- **Confidence Metrics**:
  - MODIS provides an empirical detection percentage from **0% to 100%**.
  - VIIRS provides categorical confidence classes: **low ('l')**, **nominal ('n')**, and **high ('h')**.

---

## 2. Harmonization Methodology

### Step A: Spatial Normalization to Equal-Area Grid (EPSG:6933)
Standard geographic coordinates (EPSG:4326 latitude/longitude) distort surface areas substantially as latitude increases away from the equator.

To achieve scientifically valid spatial aggregation across varying latitudes without area distortion, FirePulse projects all observation coordinates from WGS84 into **EPSG:6933 (World Cylindrical Equal Area)** using PyProj:

$$\begin{pmatrix} X \\ Y \end{pmatrix} = \mathcal{T}_{\text{EPSG:4326} \to \text{EPSG:6933}}(\text{lon}, \text{lat})$$

Each point is deterministically indexed into a 1,000 m $\times$ 1,000 m analytical grid:

$$\text{cell}_x = \left\lfloor \frac{X}{1000.0} \right\rfloor, \quad \text{cell}_y = \left\lfloor \frac{Y}{1000.0} \right\rfloor$$

$$\text{grid\_cell\_id} = \text{"cell\_1km\_"} + \text{cell}_x + \text{"\_"} + \text{cell}_y$$

> **Scientific Caveat**: Assigning observations to a common 1km grid cell is a centroid-based analytical aggregation technique. It does **not** assert that the physical ground footprints of MODIS and VIIRS pixels are identical.

---

### Step B: Temporal Harmonization (UTC Standardization)
NASA FIRMS encodes observation times as integer or string `HHMM` (e.g. `830` for 08:30 UTC, `45` for 00:45 UTC).

FirePulse standardizes all temporal values:
1. Strips non-numeric characters and zero-pads to 4 digits (`time.zfill(4)`).
2. Verifies valid 24-hour hour (`00` to `23`) and minute (`00` to `59`) bounds.
3. Constructs an ISO 8601 UTC timestamp: `YYYY-MM-DDTHH:MM:00Z`.
4. Derives a deterministic daily key: `activity_date_utc = YYYY-MM-DD`.

Local and UTC dates are strictly never mixed.

---

### Step C: Multi-Sensor Aggregation & Duplicate Prevention
When aggregating observations into `(grid_cell_id, activity_date_utc)`:

```
IF (MODIS_count > 0 AND VIIRS_count > 0):
    sensors_present = "MODIS+VIIRS"
    cross_sensor_presence = True
ELIF (MODIS_count > 0):
    sensors_present = "MODIS"
    cross_sensor_presence = False
ELSE:
    sensors_present = "VIIRS"
    cross_sensor_presence = False
```

#### Scientific Integrity Principles:
1. **Never sum raw counts as "number of fires"**: If MODIS detects 1 hotspot and VIIRS detects 4 hotspots in the same 1km cell on the same UTC day, FirePulse records **1 active grid cell** with `cross_sensor_presence = True`. It does **not** claim there were 5 fires.
2. **Never delete sensor observations**: Both original MODIS and VIIRS records are permanently retained with their satellite provenance, original confidence values, and individual FRP measurements.
3. **Sensor-specific FRP**: Mean and maximum Fire Radiative Power (MW) are computed and stored separately for MODIS and VIIRS to avoid skewing energy calibrations.

---

## 3. Statistical Anomaly Detection

### Robust Z-Score and Seasonal Baselines
Wildfire activity is highly seasonal. Comparing November fire counts against July fire counts produces misleading alerts.

FirePulse uses a retrospective seasonal window:
1. Evaluates all historical records matching the calendar day $\pm 15$ days across prior years.
2. Computes the **Historical Median**:
   $$\tilde{X} = \text{median}(\{X_1, X_2, \dots, X_N\})$$
3. Computes the **Median Absolute Deviation (MAD)**:
   $$\text{MAD} = \text{median}(|X_i - \tilde{X}|)$$
4. Computes the **Robust Z-Score**:
   $$Z_{\text{robust}} = \frac{X_{\text{observed}} - \tilde{X}}{1.4826 \times \text{MAD}}$$
5. Calculates the empirical historical percentile $P$.
6. Flags unusual activity if $P \ge 95\%$ or $Z_{\text{robust}} \ge 2.0$.

### Strict Safeguards
If less than 3 distinct observation years exist in the database for the selected Area of Interest, FirePulse blocks anomaly generation and issues the notice:
> *"Insufficient historical data for reliable anomaly analysis."*

