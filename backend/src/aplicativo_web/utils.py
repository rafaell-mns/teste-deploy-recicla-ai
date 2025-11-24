import requests
from django.contrib.gis.geos import Point

def geocode_address(rua, numero, bairro, cidade, estado, cep):
    # Monta o endereço completo
    endereco = f"{rua} {numero}, {bairro}, {cidade}, {estado}, {cep}"

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": endereco,
        "format": "json",
        "addressdetails": 1,
        "limit": 1
    }

    headers = {
        "User-Agent": "ReciclaAi-Geocoder"
    }

    try:
        r = requests.get(url, params=params, headers=headers, timeout=5)
        data = r.json()

        if not data:
            return None

        lat = float(data[0]["lat"])
        lon = float(data[0]["lon"])

        return Point(lon, lat)  # formato correto (lng, lat)

    except Exception as e:
        print("Erro ao geocodificar:", e)
        return None
