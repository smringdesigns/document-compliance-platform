import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.db.database import Base


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id"),
        nullable=False
    )

    status = Column(String, nullable=False)

    details = Column(String)

    checked_at = Column(DateTime, default=datetime.utcnow)