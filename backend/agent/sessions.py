"""
backend/agent/sessions.py

Farmer Session and Profile Management using Strands FileSessionManager.
Maintains persistent context (district, crop, growth stage, dialogue history)
across runs on disk, fulfilling the pattern in kit/blocks/b08_sessions.py.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional, Dict, Any

from strands.session import FileSessionManager

DEFAULT_STORAGE_DIR = Path(__file__).parent / ".sessions"


def get_session_manager(
    session_id: str = "farmer_default",
    storage_dir: Optional[Path | str] = None
) -> FileSessionManager:
    """
    Returns a FileSessionManager instance rooted at the target session directory.
    Creates storage directory on disk if it does not already exist.
    """
    target_dir = Path(storage_dir) if storage_dir else DEFAULT_STORAGE_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    return FileSessionManager(session_id=session_id, storage_dir=str(target_dir))


class FarmerProfileStore:
    """
    Lightweight JSON profile storage alongside session manager
    for storing structured farmer attributes (district, crop, growth stage).
    """
    def __init__(self, storage_dir: Optional[Path | str] = None) -> None:
        self.storage_dir = Path(storage_dir) if storage_dir else DEFAULT_STORAGE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.profile_file = self.storage_dir / "farmer_profiles.json"
        self._profiles = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.profile_file.exists():
            try:
                return json.loads(self.profile_file.read_text(encoding="utf-8"))
            except Exception:
                return {}
        return {}

    def _save(self) -> None:
        self.profile_file.write_text(json.dumps(self._profiles, ensure_ascii=False, indent=2), encoding="utf-8")

    def get_profile(self, session_id: str) -> Dict[str, str]:
        return self._profiles.get(session_id, {
            "district": "Madurai",
            "crop": "paddy",
            "growth_stage": "vegetative"
        })

    def update_profile(self, session_id: str, district: str = None, crop: str = None, growth_stage: str = None) -> Dict[str, str]:
        current = self.get_profile(session_id)
        if district:
            current["district"] = district
        if crop:
            current["crop"] = crop
        if growth_stage:
            current["growth_stage"] = growth_stage
        self._profiles[session_id] = current
        self._save()
        return current


profile_store = FarmerProfileStore()
