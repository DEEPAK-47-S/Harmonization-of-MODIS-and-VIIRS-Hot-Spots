"""
Comprehensive Worldwide Country & Continent Boundaries Dataset.
Based on standard ISO-3166-1 alpha-3 and Natural Earth geographic bounds.
Provides names, ISO3 codes, continents, centroids, and bounding boxes for spatial filtering.
"""

from typing import Dict, Any, List, Optional

CONTINENTS = [
    {
        "id": "world",
        "name": "Entire World",
        "code": "WORLD",
        "bounds": {"west": -180.0, "south": -90.0, "east": 180.0, "north": 90.0},
        "center": [0.0, 0.0],
        "zoom": 2
    },
    {
        "id": "asia",
        "name": "Asia",
        "code": "AS",
        "bounds": {"west": 26.0, "south": -11.0, "east": 180.0, "north": 77.0},
        "center": [34.0, 100.0],
        "zoom": 3
    },
    {
        "id": "africa",
        "name": "Africa",
        "code": "AF",
        "bounds": {"west": -17.5, "south": -35.0, "east": 51.5, "north": 37.5},
        "center": [0.0, 20.0],
        "zoom": 3
    },
    {
        "id": "europe",
        "name": "Europe",
        "code": "EU",
        "bounds": {"west": -25.0, "south": 35.0, "east": 45.0, "north": 71.0},
        "center": [54.0, 15.0],
        "zoom": 4
    },
    {
        "id": "north_america",
        "name": "North America",
        "code": "NA",
        "bounds": {"west": -168.0, "south": 7.0, "east": -52.0, "north": 83.0},
        "center": [40.0, -100.0],
        "zoom": 3
    },
    {
        "id": "south_america",
        "name": "South America",
        "code": "SA",
        "bounds": {"west": -82.0, "south": -56.0, "east": -34.0, "north": 13.0},
        "center": [-15.0, -60.0],
        "zoom": 3
    },
    {
        "id": "oceania",
        "name": "Oceania",
        "code": "OC",
        "bounds": {"west": 110.0, "south": -50.0, "east": 180.0, "north": 0.0},
        "center": [-25.0, 135.0],
        "zoom": 4
    },
    {
        "id": "antarctica",
        "name": "Antarctica",
        "code": "AN",
        "bounds": {"west": -180.0, "south": -90.0, "east": 180.0, "north": -60.0},
        "center": [-80.0, 0.0],
        "zoom": 2
    }
]

# Standard Country Directory with ISO3, Continent, Name, Centroid, and Bounding Box
COUNTRIES: Dict[str, Dict[str, Any]] = {
    "IND": {
        "iso3": "IND", "name": "India", "continent": "Asia",
        "capital": "New Delhi", "center": [20.5937, 78.9629],
        "bounds": {"west": 68.1, "south": 6.7, "east": 97.4, "north": 35.5}
    },
    "USA": {
        "iso3": "USA", "name": "United States", "continent": "North America",
        "capital": "Washington, D.C.", "center": [37.0902, -95.7129],
        "bounds": {"west": -125.0, "south": 24.5, "east": -66.9, "north": 49.4}
    },
    "BRA": {
        "iso3": "BRA", "name": "Brazil", "continent": "South America",
        "capital": "Brasília", "center": [-14.2350, -51.9253],
        "bounds": {"west": -73.9, "south": -33.7, "east": -34.8, "north": 5.3}
    },
    "AUS": {
        "iso3": "AUS", "name": "Australia", "continent": "Oceania",
        "capital": "Canberra", "center": [-25.2744, 133.7751],
        "bounds": {"west": 112.9, "south": -43.6, "east": 153.6, "north": -10.7}
    },
    "CAN": {
        "iso3": "CAN", "name": "Canada", "continent": "North America",
        "capital": "Ottawa", "center": [56.1304, -106.3468],
        "bounds": {"west": -141.0, "south": 41.7, "east": -52.6, "north": 83.1}
    },
    "IDN": {
        "iso3": "IDN", "name": "Indonesia", "continent": "Asia",
        "capital": "Jakarta", "center": [-0.7893, 113.9213],
        "bounds": {"west": 95.0, "south": -11.0, "east": 141.0, "north": 6.1}
    },
    "RUS": {
        "iso3": "RUS", "name": "Russia", "continent": "Europe/Asia",
        "capital": "Moscow", "center": [61.5240, 105.3188],
        "bounds": {"west": 19.6, "south": 41.2, "east": 180.0, "north": 81.9}
    },
    "ESP": {
        "iso3": "ESP", "name": "Spain", "continent": "Europe",
        "capital": "Madrid", "center": [40.4637, -3.7492],
        "bounds": {"west": -9.3, "south": 35.9, "east": 4.3, "north": 43.8}
    },
    "PRT": {
        "iso3": "PRT", "name": "Portugal", "continent": "Europe",
        "capital": "Lisbon", "center": [39.3999, -8.2245],
        "bounds": {"west": -9.5, "south": 36.9, "east": -6.2, "north": 42.2}
    },
    "GRC": {
        "iso3": "GRC", "name": "Greece", "continent": "Europe",
        "capital": "Athens", "center": [39.0742, 21.8243],
        "bounds": {"west": 19.4, "south": 34.8, "east": 28.2, "north": 41.7}
    },
    "FRA": {
        "iso3": "FRA", "name": "France", "continent": "Europe",
        "capital": "Paris", "center": [46.2276, 2.2137],
        "bounds": {"west": -4.8, "south": 41.3, "east": 9.6, "north": 51.1}
    },
    "DEU": {
        "iso3": "DEU", "name": "Germany", "continent": "Europe",
        "capital": "Berlin", "center": [51.1657, 10.4515],
        "bounds": {"west": 5.9, "south": 47.3, "east": 15.0, "north": 55.1}
    },
    "ITA": {
        "iso3": "ITA", "name": "Italy", "continent": "Europe",
        "capital": "Rome", "center": [41.8719, 12.5674],
        "bounds": {"west": 6.6, "south": 35.5, "east": 18.5, "north": 47.1}
    },
    "GBR": {
        "iso3": "GBR", "name": "United Kingdom", "continent": "Europe",
        "capital": "London", "center": [55.3781, -3.4360],
        "bounds": {"west": -8.6, "south": 49.9, "east": 1.8, "north": 60.9}
    },
    "ZAF": {
        "iso3": "ZAF", "name": "South Africa", "continent": "Africa",
        "capital": "Pretoria", "center": [-30.5595, 22.9375],
        "bounds": {"west": 16.5, "south": -34.8, "east": 32.9, "north": -22.1}
    },
    "COD": {
        "iso3": "COD", "name": "DR Congo", "continent": "Africa",
        "capital": "Kinshasa", "center": [-4.0383, 21.7587],
        "bounds": {"west": 12.2, "south": -13.5, "east": 31.3, "north": 5.4}
    },
    "NGA": {
        "iso3": "NGA", "name": "Nigeria", "continent": "Africa",
        "capital": "Abuja", "center": [9.0820, 8.6753],
        "bounds": {"west": 2.7, "south": 4.3, "east": 14.7, "north": 13.9}
    },
    "KEN": {
        "iso3": "KEN", "name": "Kenya", "continent": "Africa",
        "capital": "Nairobi", "center": [-0.0236, 37.9062],
        "bounds": {"west": 33.9, "south": -4.7, "east": 41.9, "north": 4.6}
    },
    "EGY": {
        "iso3": "EGY", "name": "Egypt", "continent": "Africa",
        "capital": "Cairo", "center": [26.8206, 30.8025],
        "bounds": {"west": 24.7, "south": 22.0, "east": 36.9, "north": 31.7}
    },
    "ARG": {
        "iso3": "ARG", "name": "Argentina", "continent": "South America",
        "capital": "Buenos Aires", "center": [-38.4161, -63.6167],
        "bounds": {"west": -73.6, "south": -55.1, "east": -53.6, "north": -21.8}
    },
    "CHL": {
        "iso3": "CHL", "name": "Chile", "continent": "South America",
        "capital": "Santiago", "center": [-35.6751, -71.5430],
        "bounds": {"west": -75.6, "south": -55.9, "east": -66.4, "north": -17.5}
    },
    "COL": {
        "iso3": "COL", "name": "Colombia", "continent": "South America",
        "capital": "Bogotá", "center": [4.5709, -74.2973],
        "bounds": {"west": -79.0, "south": -4.2, "east": -66.9, "north": 12.5}
    },
    "PER": {
        "iso3": "PER", "name": "Peru", "continent": "South America",
        "capital": "Lima", "center": [-9.1900, -75.0152],
        "bounds": {"west": -81.3, "south": -18.4, "east": -68.7, "north": -0.0}
    },
    "MEX": {
        "iso3": "MEX", "name": "Mexico", "continent": "North America",
        "capital": "Mexico City", "center": [23.6345, -102.5528],
        "bounds": {"west": -118.4, "south": 14.5, "east": -86.7, "north": 32.7}
    },
    "CHN": {
        "iso3": "CHN", "name": "China", "continent": "Asia",
        "capital": "Beijing", "center": [35.8617, 104.1954],
        "bounds": {"west": 73.5, "south": 18.2, "east": 134.8, "north": 53.6}
    },
    "JPN": {
        "iso3": "JPN", "name": "Japan", "continent": "Asia",
        "capital": "Tokyo", "center": [36.2048, 138.2529],
        "bounds": {"west": 122.9, "south": 24.0, "east": 153.0, "north": 45.5}
    },
    "PHL": {
        "iso3": "PHL", "name": "Philippines", "continent": "Asia",
        "capital": "Manila", "center": [12.8797, 121.7740],
        "bounds": {"west": 116.9, "south": 4.6, "east": 126.6, "north": 21.1}
    },
    "THA": {
        "iso3": "THA", "name": "Thailand", "continent": "Asia",
        "capital": "Bangkok", "center": [15.8700, 100.9925],
        "bounds": {"west": 97.3, "south": 5.6, "east": 105.6, "north": 20.5}
    },
    "VNM": {
        "iso3": "VNM", "name": "Vietnam", "continent": "Asia",
        "capital": "Hanoi", "center": [14.0583, 108.2772],
        "bounds": {"west": 102.1, "south": 8.5, "east": 109.5, "north": 23.4}
    },
    "TUR": {
        "iso3": "TUR", "name": "Turkey", "continent": "Europe/Asia",
        "capital": "Ankara", "center": [38.9637, 35.2433],
        "bounds": {"west": 25.7, "south": 35.8, "east": 44.8, "north": 42.1}
    },
    "SWE": {
        "iso3": "SWE", "name": "Sweden", "continent": "Europe",
        "capital": "Stockholm", "center": [60.1282, 18.6435],
        "bounds": {"west": 11.1, "south": 55.3, "east": 24.2, "north": 69.1}
    },
    "NZL": {
        "iso3": "NZL", "name": "New Zealand", "continent": "Oceania",
        "capital": "Wellington", "center": [-40.9006, 174.8860],
        "bounds": {"west": 166.4, "south": -47.3, "east": 178.6, "north": -34.4}
    }
}

def get_country_by_iso3(iso3: str) -> Optional[Dict[str, Any]]:
    return COUNTRIES.get(iso3.upper())

def get_countries_list() -> List[Dict[str, Any]]:
    return sorted(list(COUNTRIES.values()), key=lambda c: c["name"])

def get_continents_list() -> List[Dict[str, Any]]:
    return CONTINENTS
