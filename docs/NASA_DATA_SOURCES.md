# FirePulse — NASA FIRMS Data Sources & Specifications
**NASA Space Apps Challenge 2026 | Challenge: Harmonization of MODIS and VIIRS Hot Spots**  
**Team: Virtual Warriors**

---

## 1. Overview of NASA FIRMS

The **Fire Information for Resource Management System (FIRMS)**, developed by NASA’s Earth Science Data and Information System (ESDIS), distributes near real-time (NRT) active fire locations to natural resource managers and researchers worldwide.

Hotspots are detected using thermal anomalies identified in infrared bands sensitive to high-temperature sub-pixel emitters ($\sim$3.7–4.0 $\mu\text{m}$ and $\sim$11.0 $\mu\text{m}$).

- Official Website: [https://firms.modaps.eosdis.nasa.gov/](https://firms.modaps.eosdis.nasa.gov/)
- Official API Documentation: [https://firms.modaps.eosdis.nasa.gov/api/](https://firms.modaps.eosdis.nasa.gov/api/)
- Free MAP_KEY Registration: [https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- Live Data Availability: [https://firms.modaps.eosdis.nasa.gov/api/data_availability/](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)

---

## 2. Sensor Catalog & Operational Status

| Source ID | Sensor | Satellite(s) | Nominal Resolution | Data Type | Operational Status |
|---|---|---|---|---|---|
| `MODIS_NRT` | MODIS | Terra / Aqua | 1,000 m (1 km) | Near Real-Time | **Active** (Rolling 7 days) |
| `MODIS_SP` | MODIS | Terra / Aqua | 1,000 m (1 km) | Standard Processing (MCD14ML) | **Active** (2000 to science cutoff) |
| `VIIRS_NOAA20_NRT` | VIIRS | NOAA-20 (JPSS-1) | 375 m (I-bands) | Near Real-Time | **Active** (Rolling 7 days) |
| `VIIRS_NOAA20_SP` | VIIRS | NOAA-20 (JPSS-1) | 375 m (I-bands) | Standard Processing | **Active** (2018 to science cutoff) |
| `VIIRS_NOAA21_NRT` | VIIRS | NOAA-21 (JPSS-2) | 375 m (I-bands) | Near Real-Time | **Active** (Rolling 7 days) |
| `VIIRS_NOAA21_SP` | VIIRS | NOAA-21 (JPSS-2) | 375 m (I-bands) | Standard Processing | **Active** (2023 to science cutoff) |
| `VIIRS_SNPP_SP` | VIIRS | Suomi-NPP | 375 m (I-bands) | Standard Processing Archive | **Ceased Delivery (Nov 2, 2026)** |

---

## 3. Critical Sensor Notice: Suomi-NPP VIIRS

> **IMPORTANT CURRENT SENSOR CONDITION**:  
> In early November 2026, NASA and NOAA announced that **Suomi-NPP operational active-fire data delivery ceased on November 2, 2026**.  
>  
> - **Implication for Researchers**: Suomi-NPP data must **not** be queried for ongoing or current operational monitoring.  
> - **FirePulse Handling**: Suomi-NPP data remains integrated for historical benchmark analysis (2012–Nov 2026). For recent and ongoing active fire intelligence, FirePulse prioritizes **VIIRS NOAA-20**, **VIIRS NOAA-21**, and **MODIS Terra/Aqua**.

---

## 4. NASA FIRMS Area API Protocol

### Endpoint Syntax
```http
GET /api/area/csv/{MAP_KEY}/{SOURCE}/{AREA}/{DAY_RANGE}/{DATE}
```

### Parameter Specification
1. `{MAP_KEY}`: 32-character hexadecimal user key issued by NASA EOSDIS. Must be kept strictly confidential in `backend/.env`.
2. `{SOURCE}`: One of the supported source strings listed above (e.g. `MODIS_NRT`, `VIIRS_NOAA20_NRT`).
3. `{AREA}`: Bounding box formatted as:
   $$\text{west}, \text{south}, \text{east}, \text{north}$$
   *Example for Tamil Nadu*: `76.2,8.0,80.4,13.6`
4. `{DAY_RANGE}`: Integer between **1 and 5**. Requests exceeding 5 days are rejected by the NASA server.
5. `{DATE}`: Starting acquisition date formatted as `YYYY-MM-DD`.

### Automated Chunking & Rate Limiting in FirePulse
- **Date-Range Chunking**: When a user queries a multi-week or multi-month historical span, FirePulse's `FirmsClient.fetch_date_range()` automatically splits the query into consecutive $\le 5$-day chunks:
  $$\text{Chunk}_k = (\text{date}_k, \min(5, \text{remaining\_days}))$$
- **Rate Limit Window**: NASA enforces a limit of **5,000 transactions per 10-minute window**.
- **Bounded Backoff**: FirePulse enforces inter-request pacing ($0.5\text{s}$ delay) and exponential backoff retry ($1\text{s}, 2\text{s}, 4\text{s}$) upon receiving HTTP 429.
- **Local Raw Caching**: Raw CSV payloads are deterministically cached in `data/raw/` by `(source, area, day_range, date)` to eliminate redundant network transactions.

---

## 5. Offline Archive CSV Upload Support

For researchers working in field stations with intermittent internet or working with massive historical MCD14ML multi-year archives:
1. Users can download official shapefiles or CSV extracts from the [FIRMS Archive Download Portal](https://firms.modaps.eosdis.nasa.gov/download/).
2. Upload the uncompressed CSV via FirePulse's **Settings &rarr; Import NASA FIRMS Archive CSV** (`POST /api/data/import/archive`).
3. FirePulse validates the CSV schema, normalizes all records, executes 1km equal-area spatial harmonization, and records the file provenance in the audit table.

