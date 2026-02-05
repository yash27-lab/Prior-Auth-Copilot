from __future__ import annotations

import io
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from rules import FIELD_DEFS, REQUIRED_EITHER, REQUIRED_KEYS, SECTION_ORDER
from schema import AuditEntry, DocumentInfo, ExtractionResponse, Field, Source, SuggestedAction


@dataclass
class Line:
    text: str
    page: int
    bbox: list[float] | None


def extract_from_bytes(data: bytes, filename: str, content_type: str | None) -> dict:
    file_type = _infer_file_type(filename, content_type)
    text, lines, pages, warnings = _extract_text_and_lines(data, file_type)

    fields, field_lookup = _extract_fields(lines, text)
    missing_fields = _compute_missing_fields(field_lookup, text)
    suggested_next_action = _suggest_next_action(text, missing_fields)
    audit_trail = _build_audit_trail(fields)

    response = ExtractionResponse(
        document=DocumentInfo(
            filename=filename,
            file_type=file_type,
            pages=pages,
            warnings=warnings,
        ),
        fields=fields,
        missing_fields=missing_fields,
        suggested_next_action=suggested_next_action,
        audit_trail=audit_trail,
    )
    return response.model_dump()


def _infer_file_type(filename: str, content_type: str | None) -> str:
    ext = Path(filename).suffix.lower()
    if content_type and "pdf" in content_type:
        return "pdf"
    if ext == ".pdf":
        return "pdf"
    if content_type and content_type.startswith("image/"):
        return "image"
    if ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif", ".svg"}:
        return "image"
    return "text"


def _extract_text_and_lines(data: bytes, file_type: str) -> tuple[str, list[Line], int | None, list[str]]:
    warnings: list[str] = []

    if file_type == "pdf":
        try:
            import pdfplumber  # type: ignore

            return _extract_pdf_with_pdfplumber(data)
        except Exception as exc:  # pragma: no cover - fallback path
            warnings.append(f"pdfplumber unavailable or failed: {exc}")
            try:
                return _extract_pdf_with_pypdf(data, warnings)
            except Exception as fallback_exc:  # pragma: no cover - worst case
                warnings.append(f"pypdf failed: {fallback_exc}")
                return "", [], None, warnings

    if file_type == "image":
        return _extract_image(data, warnings)

    text = data.decode("utf-8", errors="ignore")
    lines = [Line(text=line.strip(), page=1, bbox=None) for line in text.splitlines() if line.strip()]
    return text, lines, 1, warnings


def _extract_pdf_with_pdfplumber(data: bytes) -> tuple[str, list[Line], int | None, list[str]]:
    import pdfplumber  # type: ignore

    lines: list[Line] = []
    warnings: list[str] = []

    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page_index, page in enumerate(pdf.pages):
            words = page.extract_words(
                x_tolerance=1.5,
                y_tolerance=2,
                keep_blank_chars=False,
                use_text_flow=True,
            )
            page_lines = _group_words_into_lines(words, page_index + 1)
            lines.extend(page_lines)
        pages = len(pdf.pages)

    text = "\n".join(line.text for line in lines)
    return text, lines, pages, warnings


def _extract_pdf_with_pypdf(data: bytes, warnings: list[str]) -> tuple[str, list[Line], int | None, list[str]]:
    from pypdf import PdfReader  # type: ignore

    reader = PdfReader(io.BytesIO(data))
    lines: list[Line] = []
    pages = len(reader.pages)

    for page_index, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        for line in page_text.splitlines():
            if line.strip():
                lines.append(Line(text=line.strip(), page=page_index + 1, bbox=None))

    text = "\n".join(line.text for line in lines)
    warnings.append("Bounding boxes unavailable with pypdf; audit trail uses line text only.")
    return text, lines, pages, warnings


def _extract_image(data: bytes, warnings: list[str]) -> tuple[str, list[Line], int | None, list[str]]:
    if _looks_like_svg(data):
        text = _extract_text_from_svg(data)
        lines = [Line(text=line, page=1, bbox=None) for line in text.splitlines() if line.strip()]
        warnings.append("SVG text extracted without OCR; bounding boxes unavailable.")
        return text, lines, 1, warnings

    try:
        from PIL import Image  # type: ignore
        import pytesseract  # type: ignore
    except Exception:
        warnings.append("OCR dependencies not installed; install pillow + pytesseract for image parsing.")
        return "", [], 1, warnings

    image = Image.open(io.BytesIO(data))
    ocr = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    lines_by_id: dict[int, list[int]] = {}
    for idx, line_num in enumerate(ocr.get("line_num", [])):
        if line_num is None:
            continue
        lines_by_id.setdefault(line_num, []).append(idx)

    lines: list[Line] = []
    for line_num, indices in sorted(lines_by_id.items()):
        words = [ocr["text"][i] for i in indices if ocr["text"][i].strip()]
        if not words:
            continue
        text = " ".join(words)
        x0 = min(ocr["left"][i] for i in indices)
        y0 = min(ocr["top"][i] for i in indices)
        x1 = max(ocr["left"][i] + ocr["width"][i] for i in indices)
        y1 = max(ocr["top"][i] + ocr["height"][i] for i in indices)
        lines.append(Line(text=text, page=1, bbox=[float(x0), float(y0), float(x1), float(y1)]))

    full_text = "\n".join(line.text for line in lines)
    return full_text, lines, 1, warnings


def _looks_like_svg(data: bytes) -> bool:
    head = data[:200].lower()
    return b"<svg" in head or b"</svg" in head


def _extract_text_from_svg(data: bytes) -> str:
    raw = data.decode("utf-8", errors="ignore")
    text_nodes = re.findall(r"<text[^>]*>(.*?)</text>", raw, flags=re.DOTALL | re.IGNORECASE)
    cleaned = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip() for t in text_nodes]
    return "\n".join([line for line in cleaned if line])


def _group_words_into_lines(words: Iterable[dict], page_number: int) -> list[Line]:
    lines: dict[int, list[dict]] = {}
    for word in words:
        top = float(word.get("top", 0))
        key = int(round(top / 3.0) * 3)
        lines.setdefault(key, []).append(word)

    results: list[Line] = []
    for key in sorted(lines.keys()):
        line_words = sorted(lines[key], key=lambda w: w.get("x0", 0))
        text = " ".join([w.get("text", "").strip() for w in line_words if w.get("text")])
        if not text:
            continue
        x0 = min(float(w.get("x0", 0)) for w in line_words)
        x1 = max(float(w.get("x1", 0)) for w in line_words)
        top = min(float(w.get("top", 0)) for w in line_words)
        bottom = max(float(w.get("bottom", 0)) for w in line_words)
        results.append(Line(text=text, page=page_number, bbox=[x0, top, x1, bottom]))
    return results


def _extract_fields(lines: list[Line], full_text: str) -> tuple[list[Field], dict[str, Field]]:
    found: dict[str, Field] = {}
    for line in lines:
        for field_def in FIELD_DEFS:
            if field_def.key in found:
                continue
            match = re.search(field_def.pattern, line.text, re.IGNORECASE)
            if match:
                value = _clean_value(match.group(1))
                found[field_def.key] = Field(
                    section=field_def.section,
                    key=field_def.key,
                    label=field_def.label,
                    value=value,
                    confidence=field_def.confidence,
                    source=Source(snippet=line.text.strip(), page=line.page, bbox=line.bbox),
                )

    # Light heuristic fallback if labeled patterns fail
    if "diagnosis.icd10" not in found:
        icd_match = re.search(r"\b([A-TV-Z][0-9][0-9A-Z.]{0,5})\b", full_text)
        if icd_match:
            found["diagnosis.icd10"] = Field(
                section="Diagnosis",
                key="diagnosis.icd10",
                label="ICD-10",
                value=_clean_value(icd_match.group(1)),
                confidence=0.42,
                source=None,
            )

    if "procedure.cpt" not in found:
        cpt_match = re.search(r"\b(\d{5})\b", full_text)
        if cpt_match:
            found["procedure.cpt"] = Field(
                section="Procedure",
                key="procedure.cpt",
                label="CPT",
                value=_clean_value(cpt_match.group(1)),
                confidence=0.38,
                source=None,
            )

    fields: list[Field] = []
    for field_def in FIELD_DEFS:
        field = found.get(field_def.key)
        if field is None:
            field = Field(
                section=field_def.section,
                key=field_def.key,
                label=field_def.label,
                value=None,
                confidence=0.0,
                source=None,
            )
        fields.append(field)

    # Preserve section grouping order
    fields.sort(key=lambda f: (SECTION_ORDER.index(f.section), f.label))
    return fields, {f.key: f for f in fields}


def _compute_missing_fields(fields: dict[str, Field], full_text: str) -> list[str]:
    missing: list[str] = []
    key_to_label = {field.key: field.label for field in fields.values()}

    for key in REQUIRED_KEYS:
        if not fields.get(key) or not fields[key].value:
            missing.append(key_to_label.get(key, key))

    for either_a, either_b in REQUIRED_EITHER:
        if not fields.get(either_a) or not fields[either_a].value:
            if not fields.get(either_b) or not fields[either_b].value:
                missing.append("Procedure CPT or Drug NDC")

    text_lower = full_text.lower()
    if not _contains_any(text_lower, ["chart note", "clinical note", "progress note"]):
        missing.append("Chart notes")

    has_drug = fields.get("drug.name") and fields["drug.name"].value
    if has_drug and not _contains_any(text_lower, ["step therapy", "failed step", "step-therapy"]):
        missing.append("Failed step therapy")

    if not _contains_any(text_lower, ["lab", "labs", "a1c", "cbc", "cmp"]):
        missing.append("Labs from last 90 days")

    return _dedupe_preserve_order(missing)


def _suggest_next_action(full_text: str, missing_fields: list[str]) -> SuggestedAction:
    text_lower = full_text.lower()
    if _contains_any(text_lower, ["denial", "denied", "appeal", "adverse determination"]):
        return SuggestedAction(
            action="start_appeal_draft",
            reason="Denial language detected; start an appeal draft with cited reasons.",
        )
    if missing_fields:
        return SuggestedAction(
            action="request_more_info",
            reason="Missing fields or supporting documentation need to be collected.",
        )
    return SuggestedAction(
        action="submit",
        reason="Core fields and supporting docs appear complete.",
    )


def _build_audit_trail(fields: list[Field]) -> list[AuditEntry]:
    audit: list[AuditEntry] = []
    for field in fields:
        if not field.value or not field.source:
            continue
        audit.append(
            AuditEntry(
                key=field.key,
                label=field.label,
                value=field.value,
                page=field.source.page,
                bbox=field.source.bbox,
                snippet=field.source.snippet,
            )
        )
    return audit


def _clean_value(value: str) -> str:
    return value.strip().strip(";,")


def _contains_any(text: str, needles: list[str]) -> bool:
    return any(needle in text for needle in needles)


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
