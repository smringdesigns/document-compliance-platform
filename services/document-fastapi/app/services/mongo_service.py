"""
Servicio de auditoría en MongoDB.
Registra eventos de procesamiento en las colecciones:
  - audit_logs      → cada acción sobre un documento
  - processing_events → resultado del procesamiento / compliance
"""
import os
from datetime import datetime, timezone
from pymongo import MongoClient

MONGO_URI    = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
MONGO_DB     = "compliance_audit"

_client: MongoClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    return _client[MONGO_DB]


def log_audit(action: str, document_id: str, extra: dict | None = None):
    """Guarda un registro en audit_logs (best-effort, no bloquea si Mongo falla)."""
    try:
        db = _get_db()
        db["audit_logs"].insert_one({
            "action":      action,
            "document_id": document_id,
            "timestamp":   datetime.now(timezone.utc),
            **(extra or {}),
        })
    except Exception as exc:
        # No propagamos — el flujo principal no debe fallar por auditoría
        import logging
        logging.getLogger(__name__).warning("MongoDB audit failed: %s", exc)


def log_processing_event(document_id: str, compliance_status: str, details: str):
    """Guarda el resultado de un procesamiento en processing_events."""
    try:
        db = _get_db()
        db["processing_events"].insert_one({
            "document_id":       document_id,
            "compliance_status": compliance_status,
            "details":           details,
            "timestamp":         datetime.now(timezone.utc),
        })
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("MongoDB processing event failed: %s", exc)


def save_processing_log(log_data: dict):
    """Guarda un log de procesamiento completo."""
    try:
        db = _get_db()
        log_data["timestamp"] = datetime.now(timezone.utc)
        db["processing_logs"].insert_one(log_data)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("MongoDB log save failed: %s", exc)