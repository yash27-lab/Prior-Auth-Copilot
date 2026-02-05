from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FieldDef:
    key: str
    label: str
    section: str
    pattern: str
    confidence: float


SECTION_ORDER = [
    "Patient",
    "Provider",
    "Diagnosis",
    "Procedure",
    "Drug",
    "Payer",
    "Plan",
    "Dates",
]

FIELD_DEFS = [
    FieldDef("patient.name", "Patient Name", "Patient", r"\bPatient(?: Name)?\s*[:#-]\s*(.+)", 0.88),
    FieldDef("patient.dob", "DOB", "Patient", r"\b(?:DOB|Date of Birth)\s*[:#-]\s*([0-9/.-]{6,})", 0.86),
    FieldDef("patient.member_id", "Member ID", "Patient", r"\b(?:Member ID|Subscriber ID|Policy #)\s*[:#-]\s*([A-Z0-9-]+)", 0.82),
    FieldDef("provider.name", "Provider", "Provider", r"\b(?:Provider|Ordering Provider|Physician)\s*[:#-]\s*(.+)", 0.84),
    FieldDef("provider.npi", "NPI", "Provider", r"\bNPI\s*[:#-]\s*(\d{10})\b", 0.9),
    FieldDef("diagnosis.description", "Diagnosis", "Diagnosis", r"\bDiagnosis\s*[:#-]\s*(.+)", 0.8),
    FieldDef("diagnosis.icd10", "ICD-10", "Diagnosis", r"\bICD-?10\s*[:#-]?\s*([A-TV-Z][0-9][0-9A-Z.]{0,5})\b", 0.85),
    FieldDef("procedure.description", "Procedure", "Procedure", r"\b(?:Procedure|Requested Service)\s*[:#-]\s*(.+)", 0.78),
    FieldDef("procedure.cpt", "CPT", "Procedure", r"\bCPT\s*[:#-]?\s*(\d{5})\b", 0.86),
    FieldDef("drug.name", "Drug", "Drug", r"\b(?:Drug|Medication)\s*[:#-]\s*(.+)", 0.78),
    FieldDef("drug.ndc", "NDC", "Drug", r"\bNDC\s*[:#-]?\s*([0-9-]{6,})\b", 0.84),
    FieldDef("payer.name", "Payer", "Payer", r"\b(?:Payer|Insurance)\s*[:#-]\s*(.+)", 0.82),
    FieldDef("plan.name", "Plan", "Plan", r"\bPlan\s*[:#-]\s*(.+)", 0.8),
    FieldDef("dates.requested", "Requested Date", "Dates", r"\b(?:Requested DOS|Request Date|Date of Service)\s*[:#-]\s*([0-9/.-]{6,})", 0.74),
    FieldDef("dates.service", "Service Date", "Dates", r"\b(?:Service Date|DOS)\s*[:#-]\s*([0-9/.-]{6,})", 0.72),
]

REQUIRED_KEYS = {
    "patient.name",
    "patient.dob",
    "provider.name",
    "provider.npi",
    "diagnosis.icd10",
    "payer.name",
    "plan.name",
}

REQUIRED_EITHER = [
    ("procedure.cpt", "drug.ndc"),
]

SUPPORTING_DOC_REQUIREMENTS = [
    "chart notes",
    "failed step therapy",
    "labs from last 90 days",
]
