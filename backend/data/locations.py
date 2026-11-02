"""
backend/data/locations.py

Curated agricultural districts across Tamil Nadu's diverse agro-climatic zones
with accurate GPS coordinates and local crop profiles.
Default district: Madurai (lat: 9.9252, lon: 78.1198)
"""

from typing import Dict, Any

TAMIL_NADU_DISTRICTS: Dict[str, Dict[str, Any]] = {
    "Madurai": {
        "name_en": "Madurai",
        "name_ta": "மதுரை",
        "latitude": 9.9252,
        "longitude": 78.1198,
        "zone": "Southern Agro-climatic Zone",
        "major_crops": ["paddy", "millets", "cotton", "banana", "pulses"],
        "soil_types": ["Red loam", "Black cotton soil"],
        "default": True
    },
    "Thanjavur": {
        "name_en": "Thanjavur",
        "name_ta": "தஞ்சாவூர்",
        "latitude": 10.7870,
        "longitude": 79.1378,
        "zone": "Cauvery Delta Zone (Rice Bowl)",
        "major_crops": ["paddy", "banana", "sugarcane", "coconut"],
        "soil_types": ["Alluvial delta soil", "Clay loam"]
    },
    "Coimbatore": {
        "name_en": "Coimbatore",
        "name_ta": "கோயம்புத்தூர்",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "zone": "Western Agro-climatic Zone",
        "major_crops": ["maize", "cotton", "coconut", "vegetables", "sugarcane"],
        "soil_types": ["Red sandy loam", "Black soil"]
    },
    "Tirunelveli": {
        "name_en": "Tirunelveli",
        "name_ta": "திருநெல்வேலி",
        "latitude": 8.7139,
        "longitude": 77.7567,
        "zone": "Southern Agro-climatic Zone (Tamirabarani Basin)",
        "major_crops": ["paddy", "banana", "cotton", "pulses"],
        "soil_types": ["Red sandy", "Alluvial", "Black clay"]
    },
    "Salem": {
        "name_en": "Salem",
        "name_ta": "சேலம்",
        "latitude": 11.6643,
        "longitude": 78.1460,
        "zone": "North-Western Agro-climatic Zone",
        "major_crops": ["groundnut", "maize", "cotton", "millets", "sugarcane"],
        "soil_types": ["Red sandy soil", "Gravelly red loam"]
    },
    "Cuddalore": {
        "name_en": "Cuddalore",
        "name_ta": "கடலூர்",
        "latitude": 11.7480,
        "longitude": 79.7714,
        "zone": "North-Eastern Coastal Zone",
        "major_crops": ["paddy", "sugarcane", "groundnut", "cashew"],
        "soil_types": ["Coastal alluvium", "Red soil"]
    },
    "Nagapattinam": {
        "name_en": "Nagapattinam",
        "name_ta": "நாகப்பட்டினம்",
        "latitude": 10.7672,
        "longitude": 79.8449,
        "zone": "Cauvery Delta Marine Zone",
        "major_crops": ["paddy", "pulses", "coconut"],
        "soil_types": ["Coastal delta clay", "Saline alluvial"]
    },
    "Tiruvannamalai": {
        "name_en": "Tiruvannamalai",
        "name_ta": "திருவண்ணாமலை",
        "latitude": 12.2253,
        "longitude": 79.0747,
        "zone": "North-Eastern Agro-climatic Zone",
        "major_crops": ["groundnut", "paddy", "sugarcane", "millets"],
        "soil_types": ["Red sandy", "Red loamy"]
    },
    "Dharmapuri": {
        "name_en": "Dharmapuri",
        "name_ta": "தருமபுரி",
        "latitude": 12.1211,
        "longitude": 78.1582,
        "zone": "North-Western Dryland Zone",
        "major_crops": ["millets", "tomato", "vegetables", "maize", "mango"],
        "soil_types": ["Red sandy loam", "Slightly alkaline loam"]
    },
    "Theni": {
        "name_en": "Theni",
        "name_ta": "தேனி",
        "latitude": 10.0104,
        "longitude": 77.4768,
        "zone": "Western Ghats Foothill Zone",
        "major_crops": ["cotton", "banana", "grapes", "vegetables", "sugarcane"],
        "soil_types": ["Deep red loam", "Gravelly soil"]
    },
    "Tiruchirappalli": {
        "name_en": "Tiruchirappalli",
        "name_ta": "திருச்சிராப்பள்ளி",
        "latitude": 10.7905,
        "longitude": 78.7047,
        "zone": "Central Agro-climatic Zone",
        "major_crops": ["paddy", "banana", "sugarcane", "cotton", "maize"],
        "soil_types": ["Alluvial loam", "Red soil"]
    },
    "Ramanathapuram": {
        "name_en": "Ramanathapuram",
        "name_ta": "இராமநாதபுரம்",
        "latitude": 9.3639,
        "longitude": 78.8395,
        "zone": "Southern Coastal Drought-Prone Zone",
        "major_crops": ["chilli", "cotton", "paddy", "millets", "pulses"],
        "soil_types": ["Saline coastal sandy soil", "Black clay"]
    }
}


def get_district_info(district_name: str) -> Dict[str, Any]:
    """Returns district metadata or defaults to Madurai."""
    return TAMIL_NADU_DISTRICTS.get(district_name, TAMIL_NADU_DISTRICTS["Madurai"])
