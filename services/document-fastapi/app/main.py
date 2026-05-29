from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.database import Base, engine
from app.models.document import Document
from app.models.compliance_check import ComplianceCheck
from app.api.routes.documents import router as document_router
from app.services.minio_service import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: crear tablas + bucket. Shutdown: nada que limpiar."""
    Base.metadata.create_all(bind=engine)
    ensure_bucket()
    yield


app = FastAPI(title="Document Processing Service", lifespan=lifespan)

app.include_router(
    document_router,
    prefix="/api/v1/documents",
    tags=["Documents"],
)


@app.get("/health")
def health():
    return {"status": "ok"}