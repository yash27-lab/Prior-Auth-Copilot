# Prior Auth Packet Extractor

Extracts structured prior-authorization fields from messy packets with confidence scores, missing-field checklist, and an auditable source trail.

## Features
- Upload PDF, SVG, image, or text packet
- Extracts key fields for patient, provider, diagnosis, procedure, drug, payer, plan, and dates
- Confidence scores for each field
- Missing-field checklist and suggested next action
- Audit trail for each extracted field (snippet + page + bounding box when available)

## Architecture
- `web/` Next.js app (upload + results UI)
- `api/` FastAPI service (file parsing + extraction)
- `sample_docs/` synthetic packets (SVGs you can upload as-is)

## Quickstart

### Backend
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

The UI defaults to `http://localhost:8000` for the API. Override with:
```bash
export NEXT_PUBLIC_API_URL="http://localhost:8000"
```

## Sample Documents
Upload any of these from `sample_docs/`:
- `sample_docs/packet_complete.svg`
- `sample_docs/packet_missing.svg`
- `sample_docs/packet_denial.svg`

SVGs are parsed without OCR; for scanned images, install OCR dependencies.

## OCR (Optional)
The API supports OCR for image files if you install:
- `pillow`
- `pytesseract`

You will also need the Tesseract binary on your system.

## JSON Output
The `/extract` endpoint returns:
- `document` metadata and warnings
- `fields` array with `section`, `key`, `label`, `value`, `confidence`, `source`
- `missing_fields` checklist
- `suggested_next_action` with `action` + `reason`
- `audit_trail` with snippet, page, and bounding box

## How This Plugs Into EHR + Workflow Engine
- Map the schema to EHR fields (patient demographics, provider NPI, diagnosis, procedure, drug, payer).
- Use confidence scores to decide if a human needs to confirm extracted values.
- Missing-field checklist routes tasks to nurses or intake teams.
- Suggested next action can trigger workflow automations:
  - Submit prior auth when complete
  - Request more info when supporting docs are missing
  - Start appeal draft when denial language is detected
- Audit trail supports traceability for compliance and reviewer trust.

## One-Page Addendum: EHR + Workflow Automation
**Goal:** turn unstructured packets into an auditable workflow state that EHR + portal automation can act on.

**Inputs**
- Prior auth packet (PDF/image) + metadata (payer, plan, LOB, site of care)
- Optional EHR context (patient MRN, provider NPI registry, prior auth history)

**Core Services**
- **Ingestion:** store raw packet, assign `run_id`, emit `Uploaded`
- **Parsing:** extract text + layout, emit `Parsed`
- **Extraction:** rules + LLM, emit `Extracted`
- **Validation:** required fields + payer-specific rules, emit `Validated`
- **Decision:** submit / request info / appeal draft, emit `Decision`

**Durable Run Log (Temporal-style)**
```
Uploaded → Parsed → Extracted → Validated → Decision
```
Each step writes:
- timestamps
- structured payload (fields + confidence)
- audit references (snippet, page, bbox)

**EHR + Portal Automation Hooks**
- Create/Update EHR prior auth order with extracted fields
- Auto-create tasks for missing docs (chart notes, labs, step therapy)
- Auto-fill payer portals when confidence ≥ threshold
- Generate appeal draft from denial language + evidence snippets

**Human-in-the-loop**
- Route low-confidence fields to reviewers
- Reviewer edits propagate back to the run log and EHR payload

**Compliance + Traceability**
- Every field linked to source evidence
- Full run history for audit and payer disputes

## Notes On Hybrid Extraction
This MVP uses deterministic rules and pattern matching for speed and auditability. The extractor is structured so you can add an LLM pass for messy free-text sections, then attach LLM-backed snippets to the audit trail.

## License
MIT. See `LICENSE`.

## Suggested Next Iterations
- Add LLM parsing for clinical narratives and denials
- Multi-document packet support with doc-level provenance
- Export to FHIR prior authorization payloads
- Reviewer UI with inline bounding-box highlights
