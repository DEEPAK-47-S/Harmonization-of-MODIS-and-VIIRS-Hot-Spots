# FirePulse: NASA Data Sources Registry (Phase 16)

**Challenge**: NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots  
**Team**: Virtual Warriors  

---

## 1. Supported Sensors & Satellite Constellations

| Sensor | Satellite Platform | Agency | Spatial Footprint | Operational Temporal Coverage | Status in FirePulse |
|---|---|---|---|---|---|
| **MODIS** | Terra (EOS AM-1) | NASA | 1,000 m nadir | November 2000 — Present | Supported (`MODIS_NRT`, `MODIS_SP`) |
| **MODIS** | Aqua (EOS PM-1) | NASA | 1,000 m nadir | July 2002 — Present | Supported (`MODIS_NRT`, `MODIS_SP`) |
| **VIIRS** | Suomi-NPP | NASA / NOAA | 375 m nadir (I-band) | January 2012 — November 2, 2026 | Historical Archive Supported (`VIIRS_SNPP_SP`) |
| **VIIRS** | NOAA-20 (JPSS-1) | NOAA / NASA | 375 m nadir (I-band) | April 2018 — Present | Supported (`VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`) |
| **VIIRS** | NOAA-21 (JPSS-2) | NOAA / NASA | 375 m nadir (I-band) | March 2023 — Present | Supported (`VIIRS_NOAA21_NRT`, `VIIRS_NOAA21_SP`) |

---

## 2. NASA FIRMS API Integration Endpoints

All live queries utilize official NASA FIRMS services hosted at `https://firms.modaps.eosdis.nasa.gov`:

1. **Area CSV API**:
   ```
   GET https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{AREA_COORDINATES}/{DAY_RANGE}
   ```
   - Global coverage uses area parameter `world`.
   - Regional coverage uses `west,south,east,north` bounding box.
   - Day range supports 1 to 5 days per API transaction.
2. **Data Availability API**:
   ```
   GET https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{MAP_KEY}/{SOURCE}
   ```
3. **Transaction Status API**:
   ```
   GET https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY={MAP_KEY}
   ```

---

## 3. Important Operational Notices

### Suomi-NPP VIIRS Data Delivery Cessation
> [!IMPORTANT]
> As announced by NASA FIRMS, operational data delivery for Suomi-NPP VIIRS was discontinued on **November 2, 2026**. All observations in FirePulse from Suomi-NPP are archived up to this cutoff date. Real-time and near-real-time VIIRS monitoring is maintained through NOAA-20 and NOAA-21.

### NASA FIRMS Rate Limits & Safeguards
- **Transaction Limit**: 5,000 transactions per 10-minute window per MAP_KEY.
- **Backend Protection**: Requests are rate-limited with exponential backoff (`FIRMS_RATE_LIMIT_DELAY_SECONDS=0.5`).
- **Record Deduplication**: SHA-256 fingerprint generated from `(sensor, satellite, acquisition_datetime_utc, lat, lon)` prevents duplicate records upon re-ingestion.
