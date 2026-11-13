from app import create_app
from app.utils.countries_data import get_countries_list, get_continents_list, get_country_by_iso3

def test_continents_and_countries_dataset():
    continents = get_continents_list()
    assert len(continents) >= 8
    assert continents[0]["id"] == "world"

    countries = get_countries_list()
    assert len(countries) >= 20
    
    ind = get_country_by_iso3("IND")
    assert ind is not None
    assert ind["name"] == "India"
    assert "bounds" in ind

    usa = get_country_by_iso3("USA")
    assert usa is not None
    assert usa["name"] == "United States"

def test_global_endpoints():
    app = create_app()
    client = app.test_client()

    # Continents
    res = client.get("/api/global/continents")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 8
    assert data[0]["code"] == "WORLD"

    # Countries
    res = client.get("/api/global/countries")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 20

    # Specific Country
    res = client.get("/api/global/country/IND/summary")
    assert res.status_code == 200
    data = res.get_json()
    assert "country" in data
    assert data["country"]["iso3"] == "IND"
    assert "kpis" in data

    # Coverage matrix
    res = client.get("/api/global/coverage")
    assert res.status_code == 200
    data = res.get_json()
    assert "sources_matrix" in data
    assert len(data["sources_matrix"]) >= 7

    # Global summary
    res = client.get("/api/global/summary")
    assert res.status_code == 200
    data = res.get_json()
    assert data["scope"] == "GLOBAL"
    assert "kpis" in data

    # Map density
    res = client.get("/api/global/map-density?zoom=3")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
