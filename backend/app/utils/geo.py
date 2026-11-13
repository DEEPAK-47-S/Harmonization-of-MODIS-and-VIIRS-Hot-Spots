import math
from typing import Tuple, Dict, Any, Optional
from pyproj import Transformer, CRS

# Cylindrical Equal Area (EPSG:6933) is an equal-area projection ideal for global grid aggregations.
# WGS 84 (EPSG:4326) is the standard GPS/FIRMS lat/lon coordinate reference system.
_CRS_WGS84 = CRS.from_epsg(4326)
_CRS_EQUAL_AREA = CRS.from_epsg(6933)

# Transformer: always_xy=True ensures (lon, lat) -> (x, y)
_to_equal_area = Transformer.from_crs(_CRS_WGS84, _CRS_EQUAL_AREA, always_xy=True)
_to_wgs84 = Transformer.from_crs(_CRS_EQUAL_AREA, _CRS_WGS84, always_xy=True)

GRID_CELL_SIZE_METERS = 1000.0  # 1 km x 1 km analytical cell

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """Validate latitude and longitude ranges."""
    if lat is None or lon is None:
        return False, "Coordinates cannot be None"
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (ValueError, TypeError):
        return False, "Coordinates must be numerical"
    
    if math.isnan(lat_f) or math.isnan(lon_f) or math.isinf(lat_f) or math.isinf(lon_f):
        return False, "Coordinates cannot be NaN or Infinite"
        
    if not (-90.0 <= lat_f <= 90.0):
        return False, f"Latitude {lat_f} out of range [-90, 90]"
    if not (-180.0 <= lon_f <= 180.0):
        return False, f"Longitude {lon_f} out of range [-180, 180]"
        
    return True, None

def validate_aoi(west: float, south: float, east: float, north: float) -> Tuple[bool, Optional[str]]:
    """Validate bounding box parameters for FIRMS queries."""
    for val, name in [(west, "west"), (south, "south"), (east, "east"), (north, "north")]:
        try:
            f_val = float(val)
            if math.isnan(f_val) or math.isinf(f_val):
                return False, f"{name} is NaN or Infinite"
        except (ValueError, TypeError):
            return False, f"{name} must be a valid float"
            
    if not (-180.0 <= west <= 180.0):
        return False, f"West {west} out of range [-180, 180]"
    if not (-180.0 <= east <= 180.0):
        return False, f"East {east} out of range [-180, 180]"
    if not (-90.0 <= south <= 90.0):
        return False, f"South {south} out of range [-90, 90]"
    if not (-90.0 <= north <= 90.0):
        return False, f"North {north} out of range [-90, 90]"
        
    if south >= north:
        return False, f"South latitude ({south}) must be less than North latitude ({north})"
    if west > east:
        return False, f"West longitude ({west}) cannot exceed East longitude ({east})"
        
    return True, None

def coords_to_grid_cell(lat: float, lon: float, cell_size_m: float = GRID_CELL_SIZE_METERS) -> Dict[str, Any]:
    """
    Transform EPSG:4326 lat/lon to EPSG:6933 equal-area projection and
    determine the deterministic 1km x 1km grid cell identifier and projected coordinates.
    """
    x, y = _to_equal_area.transform(lon, lat)
    
    cell_x = int(math.floor(x / cell_size_m))
    cell_y = int(math.floor(y / cell_size_m))
    
    grid_cell_id = f"cell_1km_{cell_x}_{cell_y}"
    
    return {
        "grid_cell_id": grid_cell_id,
        "proj_x": x,
        "proj_y": y,
        "cell_x": cell_x,
        "cell_y": cell_y,
        "cell_size_m": cell_size_m
    }

def grid_cell_to_bounds_wgs84(cell_x: int, cell_y: int, cell_size_m: float = GRID_CELL_SIZE_METERS) -> Dict[str, float]:
    """
    Convert a grid cell identifier back into WGS84 bounding box (west, south, east, north)
    and center point (lat, lon) for map rendering.
    """
    min_x = cell_x * cell_size_m
    min_y = cell_y * cell_size_m
    max_x = min_x + cell_size_m
    max_y = min_y + cell_size_m
    
    min_lon, min_lat = _to_wgs84.transform(min_x, min_y)
    max_lon, max_lat = _to_wgs84.transform(max_x, max_y)
    
    center_lon, center_lat = _to_wgs84.transform(min_x + cell_size_m / 2.0, min_y + cell_size_m / 2.0)
    
    return {
        "west": min_lon,
        "south": min_lat,
        "east": max_lon,
        "north": max_lat,
        "center_lon": center_lon,
        "center_lat": center_lat
    }

