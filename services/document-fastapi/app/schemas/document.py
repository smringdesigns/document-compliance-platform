from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import List


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    document_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DocumentResponse]
