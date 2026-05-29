import uuid
from sqlalchemy import Column, String, TIMESTAMP, Integer, text
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String)
    filename = Column(String)
    original_name = Column(String)
    document_type = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    storage_path = Column(String)
    minio_key = Column(String)
    status = Column(String, default="UPLOADED")
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP")
    )