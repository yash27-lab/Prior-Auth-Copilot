export type Source = {
  snippet?: string | null;
  page?: number | null;
  bbox?: number[] | null;
};

export type Field = {
  section: string;
  key: string;
  label: string;
  value?: string | null;
  confidence: number;
  source?: Source | null;
};

export type SuggestedAction = {
  action: "submit" | "request_more_info" | "start_appeal_draft";
  reason: string;
};

export type DocumentInfo = {
  filename: string;
  file_type: string;
  pages?: number | null;
  warnings?: string[];
};

export type AuditEntry = {
  key: string;
  label: string;
  value?: string | null;
  page?: number | null;
  bbox?: number[] | null;
  snippet?: string | null;
};

export type ExtractionResponse = {
  document: DocumentInfo;
  fields: Field[];
  missing_fields: string[];
  suggested_next_action: SuggestedAction;
  audit_trail: AuditEntry[];
};
