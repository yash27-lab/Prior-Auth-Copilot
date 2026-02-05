"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { demoIncompleteResponse, demoResponse } from "@/lib/demo";
import type { AuditEntry, ExtractionResponse, Field } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const formatActionLabel = (action: ExtractionResponse["suggested_next_action"]["action"]) => {
  if (action === "request_more_info") return "Request More Info";
  if (action === "start_appeal_draft") return "Start Appeal Draft";
  return "Submit";
};

const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;

const groupBySection = (fields: Field[]) => {
  const map = new Map<string, Field[]>();
  fields.forEach((field) => {
    if (!map.has(field.section)) {
      map.set(field.section, []);
    }
    map.get(field.section)?.push(field);
  });
  return Array.from(map.entries());
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;

const formatMissingReason = (item: string) => {
  const lowered = item.toLowerCase();
  if (lowered.includes("npi")) return "NPI";
  if (lowered.includes("chart")) return "chart notes";
  if (lowered.includes("step therapy")) return "step therapy evidence";
  if (lowered.includes("labs")) return "labs";
  if (lowered.includes("signature")) return "signature";
  return item.toLowerCase();
};

const buildAppealOutline = (payload: ExtractionResponse) => {
  const denialReason = "- [Insert payer denial rationale]";
  const evidenceItems =
    payload.audit_trail.length > 0
      ? payload.audit_trail.slice(0, 4).map(
          (entry) => `- ${entry.label}: ${entry.value ?? "—"}${entry.page ? ` (p${entry.page})` : ""}`
        )
      : payload.fields
          .filter((field) => field.value)
          .slice(0, 4)
          .map((field) => `- ${field.label}: ${field.value}`);
  const attachments = payload.missing_fields.length
    ? payload.missing_fields.map((item) => `- ${item}`)
    : ["- Chart notes", "- Labs", "- Prior auth request form"];

  return [
    "Appeal Outline",
    "",
    "Denial reason:",
    denialReason,
    "",
    "Evidence:",
    evidenceItems.join("\n") || "- [Add clinical evidence]",
    "",
    "Attachments:",
    attachments.join("\n")
  ].join("\n");
};

const downloadText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

type RunMeta = {
  runId: string;
  timeline: { label: string; time: string }[];
};

const buildRunMeta = (): RunMeta => {
  const now = new Date();
  const runId = `RUN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const steps = ["Uploaded", "Parsed", "Extracted", "Validated", "Decision"];
  const timeline = steps.map((label, index) => {
    const stepTime = new Date(now.getTime() + index * 38_000);
    return {
      label,
      time: stepTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
  });
  return { runId, timeline };
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ExtractionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortByConfidence, setSortByConfidence] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [runMeta, setRunMeta] = useState<RunMeta | null>(null);
  const [appealOutline, setAppealOutline] = useState<string | null>(null);
  const appealRef = useRef<HTMLDivElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (!data) return [] as [string, Field[]][];
    return groupBySection(data.fields);
  }, [data]);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/extract`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const payload = (await response.json()) as ExtractionResponse;
      setData(payload);
      setRunMeta(buildRunMeta());
      setAppealOutline(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const action = data?.suggested_next_action;
  const extractedCount = data?.fields.filter((field) => field.value).length ?? 0;
  const totalCount = data?.fields.length ?? 0;
  const lowConfidenceCount =
    data?.fields.filter((field) => !field.value || field.confidence < LOW_CONFIDENCE_THRESHOLD).length ?? 0;

  const missingReasons = data?.missing_fields ?? [];
  const prioritizedReasons = (() => {
    const picked: string[] = [];
    const used = new Set<string>();
    const priority = [
      { key: "npi", test: (item: string) => item.toLowerCase().includes("npi") },
      { key: "chart", test: (item: string) => item.toLowerCase().includes("chart") },
      { key: "step", test: (item: string) => item.toLowerCase().includes("step therapy") }
    ];

    priority.forEach((rule) => {
      const match = missingReasons.find((item) => rule.test(item));
      if (match && !used.has(match)) {
        picked.push(match);
        used.add(match);
      }
    });

    missingReasons.forEach((item) => {
      if (!used.has(item)) {
        picked.push(item);
        used.add(item);
      }
    });

    return picked;
  })();
  const whyLine = missingReasons.length
    ? `Why: Missing ${prioritizedReasons
        .slice(0, 3)
        .map(formatMissingReason)
        .join(" + ")}${missingReasons.length > 3 ? ` + ${missingReasons.length - 3} more` : ""}`
    : "Why: Core fields and supporting documentation appear complete.";

  const confidenceByKey = useMemo(() => {
    if (!data) return new Map<string, number>();
    return new Map(data.fields.map((field) => [field.key, field.confidence]));
  }, [data]);

  useEffect(() => {
    setSelectedField(null);
  }, [data]);

  useEffect(() => {
    if (appealOutline && appealRef.current) {
      appealRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [appealOutline]);

  useEffect(() => {
    if (!copyStatus) return;
    const timer = window.setTimeout(() => setCopyStatus(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Prior Auth Copilot</h1>
          <p>
            Upload a messy prior auth packet and get structured fields, confidence scores, a missing-field checklist,
            and a recommended next step.
          </p>
        </div>
        <div className="pill">Doc → Fields → Decision → Next Step</div>
      </header>

      <section className="grid">
        <div className="panel upload">
          <h2>1. Upload Packet</h2>
          <div className="upload-card">
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.svg,.txt"
            />
            <div className="notice">
              Supported: PDF, SVG, images (OCR optional), or plain text. SVG and text files work out of the box.
            </div>
            <div className="badges">
              <span className="badge">Patient</span>
              <span className="badge">Provider</span>
              <span className="badge">Diagnosis</span>
              <span className="badge">Procedure</span>
              <span className="badge">Drug</span>
              <span className="badge">Payer</span>
              <span className="badge">Plan</span>
              <span className="badge">Dates</span>
            </div>
            <div>
              <button className="button" onClick={handleSubmit} disabled={!file || loading}>
                {loading ? "Extracting..." : "Extract Fields"}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setData(demoResponse);
                  setRunMeta(buildRunMeta());
                  setError(null);
                  setAppealOutline(null);
                }}
                style={{ marginLeft: 12 }}
              >
                Use Demo Data
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setData(demoIncompleteResponse);
                  setRunMeta(buildRunMeta());
                  setError(null);
                  setAppealOutline(null);
                }}
                style={{ marginLeft: 12 }}
              >
                Load Incomplete Packet
              </button>
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <h2>2. Missing-Field Checklist</h2>
            {data?.missing_fields?.length ? (
              <div className="badges">
                {data.missing_fields.map((item) => (
                  <span className="badge" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="notice">No missing fields detected.</div>
            )}
          </div>

          {action && (
            <div className="action">
              <strong>Suggested Next Action</strong>
              <div className="label">{formatActionLabel(action.action)}</div>
              <div className="notice">{action.reason}</div>
              <div className="notice">{whyLine}</div>
              {action.action === "start_appeal_draft" && (
                <button
                  className="button secondary"
                  onClick={() => {
                    if (!data) return;
                    setAppealOutline(buildAppealOutline(data));
                  }}
                  style={{ alignSelf: "flex-start" }}
                >
                  Generate Appeal Outline
                </button>
              )}
              {appealOutline && action.action === "start_appeal_draft" && (
                <div className="outline" style={{ marginTop: 12 }}>
                  {appealOutline}
                </div>
              )}
              {appealOutline && action.action === "start_appeal_draft" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    className="button secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(appealOutline);
                        setCopyStatus("Copied");
                      } catch {
                        setCopyStatus("Copy failed");
                      }
                    }}
                  >
                    Copy to clipboard
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => downloadText(appealOutline, "appeal-outline.txt")}
                  >
                    Download .txt
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => downloadText(appealOutline, "appeal-outline.md")}
                  >
                    Download .md
                  </button>
                  {copyStatus && <span className="notice">{copyStatus}</span>}
                </div>
              )}
            </div>
          )}

          {error && <div className="notice" style={{ color: "var(--danger)" }}>{error}</div>}

          <div className="panel" style={{ padding: 16 }}>
            <h2>Workflow Timeline</h2>
            <div className="notice">Durable run log (Temporal-style)</div>
            {runMeta ? (
              <>
                <div className="notice" style={{ marginBottom: 8 }}>
                  Run ID: {runMeta.runId}
                </div>
                <div className="timeline">
                  {runMeta.timeline.map((item) => (
                    <div className="timeline-item" key={item.label}>
                      <span>{item.label}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="notice">Upload a packet to generate a workflow timeline.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <h2>3. Extracted Fields</h2>
          {!data && <div className="notice">Upload a packet to see the extracted fields and audit trail.</div>}

          {data && (
            <>
              <div className="summary-strip">
                <div className="summary-card">
                  <span>Fields extracted</span>
                  <strong>
                    {extractedCount}/{totalCount}
                  </strong>
                </div>
                <div className="summary-card">
                  <span>Low-confidence fields</span>
                  <strong>{lowConfidenceCount}</strong>
                </div>
                <div className="summary-card">
                  <span>Recommended action</span>
                  <strong>{formatActionLabel(action?.action ?? "submit")}</strong>
                </div>
              </div>
              <div className="notice" style={{ marginBottom: 12 }}>
                Document: {data.document.filename} · Type: {data.document.file_type}
                {data.document.pages ? ` · Pages: ${data.document.pages}` : ""}
              </div>
              {data.document.warnings?.length ? (
                <div className="notice" style={{ marginBottom: 16 }}>
                  {data.document.warnings.join(" ")}
                </div>
              ) : null}

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <label className="notice">Sort by confidence</label>
                <button
                  className="button secondary"
                  onClick={() => setSortByConfidence((prev) => !prev)}
                >
                  {sortByConfidence ? "High → Low" : "Default"}
                </button>
              </div>

              {sections.map(([section, fields]) => {
                const orderedFields = sortByConfidence
                  ? [...fields].sort((a, b) => b.confidence - a.confidence)
                  : fields;
                return (
                <div key={section} style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: "12px 0" }}>{section}</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Confidence</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedFields.map((field) => (
                        <tr key={field.key}>
                          <td>{field.label}</td>
                          <td>{field.value ? field.value : <span className="missing">Missing</span>}</td>
                          <td>
                            <div className="confidence">
                              <div className="confidence-bar">
                                <span style={{ width: `${Math.min(field.confidence * 100, 100)}%` }} />
                              </div>
                              <span>{formatConfidence(field.confidence)}</span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="link-button"
                              disabled={!field.source}
                              onClick={() => {
                                if (!field.source) return;
                                setSelectedField(field);
                              }}
                            >
                              View source
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )})}
            </>
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>4. Audit Trail</h2>
        {!data?.audit_trail?.length && (
          <div className="notice">No audit trail entries yet. Fields with snippets appear here.</div>
        )}
        {data?.audit_trail?.length ? (
          <div className="audit-list">
            {data.audit_trail.map((entry: AuditEntry, index: number) => (
              <div className="audit-item" key={`${entry.key}-${index}`}>
                <h4>
                  {entry.label}: {entry.value}
                </h4>
                {entry.snippet && <div className="notice">"{entry.snippet}"</div>}
                <div className="audit-meta">
                  {entry.page ? <span>Page {entry.page}</span> : <span>Page —</span>}
                  {entry.bbox ? <span>Bounding box: {entry.bbox.join(", ")}</span> : <span>Bounding box —</span>}
                  <span>
                    Confidence: {confidenceByKey.has(entry.key) ? formatConfidence(confidenceByKey.get(entry.key) ?? 0) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {appealOutline && (
        <section className="panel" style={{ marginTop: 24 }} ref={appealRef}>
          <h2>Appeal Outline</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(appealOutline);
                  setCopyStatus("Copied");
                } catch {
                  setCopyStatus("Copy failed");
                }
              }}
            >
              Copy to clipboard
            </button>
            <button
              className="button secondary"
              onClick={() => downloadText(appealOutline, "appeal-outline.txt")}
            >
              Download .txt
            </button>
            <button
              className="button secondary"
              onClick={() => downloadText(appealOutline, "appeal-outline.md")}
            >
              Download .md
            </button>
            {copyStatus && <span className="notice">{copyStatus}</span>}
          </div>
          <div className="outline">{appealOutline}</div>
        </section>
      )}

      {selectedField && (
        <aside className="drawer">
          <div className="drawer-header">
            <h3>Source Evidence</h3>
            <button className="button secondary" onClick={() => setSelectedField(null)}>
              Close
            </button>
          </div>
          <div>
            <strong>{selectedField.label}</strong>
          </div>
          <div className="snippet">
            {selectedField.source?.snippet ? `"${selectedField.source.snippet}"` : "No snippet available."}
          </div>
          <div className="notice">
            Page: {selectedField.source?.page ?? "—"}
          </div>
          <div className="notice">
            Bounding box: {selectedField.source?.bbox ? selectedField.source.bbox.join(", ") : "—"}
          </div>
        </aside>
      )}
    </main>
  );
}
