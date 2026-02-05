from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field as PydanticField


class Source(BaseModel):
    snippet: Optional[str] = None
    page: Optional[int] = None
    bbox: Optional[list[float]] = None


class Field(BaseModel):
    section: str
    key: str
    label: str
    value: Optional[str] = None
    confidence: float = 0.0
    source: Optional[Source] = None


class SuggestedAction(BaseModel):
    action: Literal["submit", "request_more_info", "start_appeal_draft"]
    reason: str


class DocumentInfo(BaseModel):
    filename: str
    file_type: str
    pages: Optional[int] = None
    warnings: list[str] = PydanticField(default_factory=list)


class AuditEntry(BaseModel):
    key: str
    label: str
    value: Optional[str] = None
    page: Optional[int] = None
    bbox: Optional[list[float]] = None
    snippet: Optional[str] = None


class ExtractionResponse(BaseModel):
    document: DocumentInfo
    fields: list[Field]
    missing_fields: list[str]
    suggested_next_action: SuggestedAction
    audit_trail: list[AuditEntry]
