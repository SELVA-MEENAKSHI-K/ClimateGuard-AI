"""
backend/agent/safety.py

Life-Safety and Severe-Weather Emergency Gate for ClimateGuard AI.
Implemented as a Strands HookProvider on the graph using BeforeNodeCallEvent.

Cancels LLM agent execution immediately upon detection of severe-weather/emergency
words in English or Tamil (cyclone, flood water in house, lightning, heat stroke, fainting)
and delivers deterministic, code-owned bilingual safety guidance.
No LLM writes or alters emergency life-safety text.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Tuple, List, Optional

from strands.hooks import BeforeNodeCallEvent, HookProvider, HookRegistry

# Emergency triggers across both languages
EMERGENCY_TRIGGERS = {
    "cyclone": [
        "cyclone", "gale", "landfall", "hurricane", "typhoon", "severe storm",
        "புயல்", "சூறாவளி", "சூறைக்காற்று", "மழைப்புயல்", "கடும் புயல்"
    ],
    "flood water in house": [
        "flood water in house", "water entered house", "flooded house", "water inside house",
        "house is flooded", "house flooded", "water entering house", "flood in house", "flood entering home",
        "வீட்டில் வெள்ளம்", "வீட்டுக்குள் தண்ணீர்", "வீட்டில் தண்ணீர் புகுந்து", "வீட்டுக்குள் வெள்ளம்",
        "வீடு மூழ்கி", "வீட்டிற்குள் வெள்ளநீர்", "வீட்டுக்குள் வெள்ள நீர்", "வீட்டிற்குள் வெள்ள நீர்",
        "வெள்ள நீர் புகுந்து", "வெள்ளம் புகுந்து", "வெள்ள நீர் சூழ்ந்து", "வெள்ளம் சூழ்ந்து"
    ],
    "lightning": [
        "lightning", "thunderbolt", "thunderstorm strike", "struck by lightning", "lightning strike",
        "இடி", "மின்னல்", "இடி மின்னல்", "இடிதாக்கி", "மின்னல் தாக்கி"
    ],
    "heat stroke": [
        "heat stroke", "sun stroke", "heatstroke", "sunstroke", "body burning hot", "stopped sweating",
        "வெப்பத் தாக்கம்", "சூரியத் தாக்கம்", "அனல் தாக்கம்", "உடல் கொதித்து வியர்வை நின்றது"
    ],
    "fainting": [
        "fainting", "fainted", "passed out", "blacked out", "collapsed and not waking", "unconscious",
        "மயக்கம்", "மயங்கி விழுந்து", "சுயநினைவு இழ", "எழுந்திருக்கவில்லை", "நினைவிழந்தார்"
    ]
}

# Negation prefixes so questions like "no cyclone" or "without lightning" are not falsely flagged
NEGATIONS = ["no ", "not ", "never ", "without ", "இல்லை ", "இல்லாமல் "]

# Deterministic bilingual safety advisories (Code-owned, no LLM)
EMERGENCY_TEXT = {
    "en": (
        "EMERGENCY LIFE-SAFETY WARNING: Extreme severe weather or medical emergency detected. "
        "Suspend all outdoor and field activities immediately. "
        "Move to higher ground, a sturdy concrete building, or your nearest designated Cyclone Relief Centre. "
        "Stay indoors away from metal roofs, open fields, and trees during lightning. "
        "Contact the District Disaster Management Authority Control Room at 1077 or Emergency Medical Services at 108 / 112 immediately."
    ),
    "ta": (
        "அவசர கால உயிர் பாதுகாப்பு எச்சரிக்கை: தீவிர வானிலை அல்லது அவசர நிலை கண்டறியப்பட்டுள்ளது. "
        "அனைத்து வெளிக்கள மற்றும் விவசாய பணிகளையும் உடனே நிறுத்துங்கள். "
        "உடனடியாக பாதுகாப்பான உயரமான இடம், கான்கிரீட் கட்டிடம் அல்லது அருகிலுள்ள புயல் நிவாரண முகாமிற்குச் செல்லுங்கள். "
        "இடி மின்னலின் போது திறந்த வெளி, மரங்கள் அல்லது தகரக் கொட்டகைகளின் கீழ் நிற்காமல் பாதுகாப்பான கட்டிடத்திற்குள் இருங்கள். "
        "உடனடி மீட்பு மற்றும் மருத்துவ உதவிக்கு மாவட்ட பேரிடர் கட்டுப்பாட்டு அறையை (1077) அல்லது அவசர எண்ணை (108 / 112) உடனே அழையுங்கள்."
    )
}

EMERGENCY_STEPS = {
    "en": [
        "Stop all farming and outdoor work immediately.",
        "Move family and livestock to higher ground or a cyclone relief shelter.",
        "Turn off main electrical power switches if flood water enters the premises.",
        "Avoid taking shelter under trees or near electric poles during lightning.",
        "Call 1077 (District Disaster Room) or 108 (Ambulance) for emergency assistance."
    ],
    "ta": [
        "அனைத்து விவசாயப் பணிகளையும் உடனடியாக நிறுத்துங்கள்.",
        "குடும்பத்தினரையும் கால்நடைகளையும் உடனடியாக உயரமான பாதுகாப்பான இடத்திற்கு மாற்றுங்கள்.",
        "வீட்டுக்குள் வெள்ள நீர் புகுந்தால் மின் இணைப்பை உடனடியாக துண்டிக்கவும்.",
        "இடி மின்னலின் போது மரங்களின் அடியிலோ அல்லது மின் கம்பங்களின் அருகிலோ நிற்காதீர்கள்.",
        "உடனடி உதவிக்கு 1077 (பேரிடர் கட்டுப்பாட்டு அறை) அல்லது 108 (ஆம்புலன்ஸ்) அழையுங்கள்."
    ]
}

EMERGENCY_ESCALATION = {
    "en": "Call 1077 (Tamil Nadu District Disaster Management Control Room), 108 (Medical Ambulance), or 112 (National Emergency). Official IMD warnings take absolute priority.",
    "ta": "உடனடி உதவிக்கு 1077 (தமிழ்நாடு மாவட்ட பேரிடர் மேலாண்மை மையம்), 108 (அவசர ஆம்புலன்ஸ்) அல்லது 112 (தேசிய அவசர உதவி) அழையுங்கள். அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முழு முன்னுரிமை."
}


def _normalize(text: str) -> str:
    return unicodedata.normalize("NFC", text or "").lower()


def _matches_phrase(text: str, phrase: str) -> bool:
    p = _normalize(phrase)
    if re.fullmatch(r"[a-z0-9' -]+", p):
        # Match whole words for Latin text
        for m in re.finditer(r"(?<![a-z])" + re.escape(p) + r"(?![a-z])", text):
            prefix = text[max(0, m.start() - 12):m.start()]
            if not any(prefix.endswith(n) for n in NEGATIONS):
                return True
        return False
    # Substring match for Tamil script
    return p in text


def check_safety(text: str) -> Tuple[Optional[str], List[str]]:
    """
    Evaluates raw user text for life-safety emergency indicators.
    Returns:
        ("emergency", [trigger_names]) if severe weather / health hazard detected,
        else (None, [])
    """
    normalized = _normalize(text)
    matched_triggers = []

    for category, phrases in EMERGENCY_TRIGGERS.items():
        if any(_matches_phrase(normalized, p) for p in phrases):
            matched_triggers.append(category)

    if matched_triggers:
        return "emergency", matched_triggers

    return None, []


class SevereWeatherGate(HookProvider):
    """
    Strands HookProvider that cancels graph nodes when an emergency life-safety
    or severe weather trigger is found in the user prompt.
    """
    def __init__(self) -> None:
        self.tripped: list[str] = []

    def register_hooks(self, registry: HookRegistry, **_: object) -> None:
        registry.add_callback(BeforeNodeCallEvent, self._before_node)

    def _before_node(self, event: BeforeNodeCallEvent) -> None:
        user_text = str(event.invocation_state.get("user_text", ""))
        tier, triggers = check_safety(user_text)
        if tier == "emergency":
            self.tripped = triggers
            event.cancel_node = "severe weather emergency: " + ", ".join(triggers)
