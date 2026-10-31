import os
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.database.session import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False

    storage_dir = Path(os.getenv("STORAGE_DIR", "../storage"))
    storage_exists = storage_dir.exists()

    gemini_key_present = bool(os.getenv("GEMINI_API_KEY"))

    return {
        "status": "healthy" if db_ok else "degraded",
        "platform": "NexusClaim Autonomous Claims Intelligence",
        "version": "1.0.0",
        "database": "connected" if db_ok else "unreachable",
        "storage": "accessible" if storage_exists else "missing",
        "gemini_api": "configured" if gemini_key_present else "fallback_mode",
        "timestamp": os.getenv("CURRENT_TIME", "2026-10-31T11:00:00Z")
    }

