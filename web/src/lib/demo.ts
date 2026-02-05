import type { ExtractionResponse } from "@/lib/types";

export const demoResponse: ExtractionResponse = {
  document: {
    filename: "sample_packet_complete.svg",
    file_type: "image",
    pages: 1,
    warnings: ["Demo data loaded locally."]
  },
  fields: [
    {
      section: "Patient",
      key: "patient.name",
      label: "Patient Name",
      value: "Avery Patel",
      confidence: 0.91,
      source: {
        snippet: "Patient Name: Avery Patel",
        page: 1,
        bbox: [40, 120, 420, 140]
      }
    },
    {
      section: "Patient",
      key: "patient.dob",
      label: "DOB",
      value: "02/14/1981",
      confidence: 0.88,
      source: {
        snippet: "DOB: 02/14/1981",
        page: 1,
        bbox: [40, 142, 280, 160]
      }
    },
    {
      section: "Patient",
      key: "patient.member_id",
      label: "Member ID",
      value: "HP-449201",
      confidence: 0.83,
      source: {
        snippet: "Member ID: HP-449201",
        page: 1,
        bbox: [40, 164, 300, 182]
      }
    },
    {
      section: "Provider",
      key: "provider.name",
      label: "Provider",
      value: "Dr. Sofia Kim",
      confidence: 0.86,
      source: {
        snippet: "Ordering Provider: Dr. Sofia Kim",
        page: 1,
        bbox: [40, 210, 420, 230]
      }
    },
    {
      section: "Provider",
      key: "provider.npi",
      label: "NPI",
      value: "1234567890",
      confidence: 0.92,
      source: {
        snippet: "NPI: 1234567890",
        page: 1,
        bbox: [40, 232, 240, 250]
      }
    },
    {
      section: "Diagnosis",
      key: "diagnosis.description",
      label: "Diagnosis",
      value: "Rheumatoid arthritis, seropositive",
      confidence: 0.79,
      source: {
        snippet: "Diagnosis: Rheumatoid arthritis, seropositive",
        page: 1,
        bbox: [40, 280, 600, 300]
      }
    },
    {
      section: "Diagnosis",
      key: "diagnosis.icd10",
      label: "ICD-10",
      value: "M05.79",
      confidence: 0.87,
      source: {
        snippet: "ICD-10: M05.79",
        page: 1,
        bbox: [40, 302, 220, 320]
      }
    },
    {
      section: "Procedure",
      key: "procedure.description",
      label: "Procedure",
      value: "Infusion therapy",
      confidence: 0.74,
      source: {
        snippet: "Procedure: Infusion therapy",
        page: 1,
        bbox: [40, 350, 420, 370]
      }
    },
    {
      section: "Procedure",
      key: "procedure.cpt",
      label: "CPT",
      value: "96413",
      confidence: 0.86,
      source: {
        snippet: "CPT: 96413",
        page: 1,
        bbox: [40, 372, 200, 390]
      }
    },
    {
      section: "Drug",
      key: "drug.name",
      label: "Drug",
      value: "Infliximab",
      confidence: 0.81,
      source: {
        snippet: "Drug: Infliximab",
        page: 1,
        bbox: [40, 420, 300, 440]
      }
    },
    {
      section: "Drug",
      key: "drug.ndc",
      label: "NDC",
      value: "00006-4401-61",
      confidence: 0.84,
      source: {
        snippet: "NDC: 00006-4401-61",
        page: 1,
        bbox: [40, 442, 260, 460]
      }
    },
    {
      section: "Payer",
      key: "payer.name",
      label: "Payer",
      value: "Horizon Prime",
      confidence: 0.82,
      source: {
        snippet: "Payer: Horizon Prime",
        page: 1,
        bbox: [40, 490, 320, 510]
      }
    },
    {
      section: "Plan",
      key: "plan.name",
      label: "Plan",
      value: "Horizon Prime Gold PPO",
      confidence: 0.8,
      source: {
        snippet: "Plan: Horizon Prime Gold PPO",
        page: 1,
        bbox: [40, 512, 420, 532]
      }
    },
    {
      section: "Dates",
      key: "dates.requested",
      label: "Requested Date",
      value: "01/12/2026",
      confidence: 0.74,
      source: {
        snippet: "Request Date: 01/12/2026",
        page: 1,
        bbox: [40, 560, 300, 580]
      }
    },
    {
      section: "Dates",
      key: "dates.service",
      label: "Service Date",
      value: "02/04/2026",
      confidence: 0.72,
      source: {
        snippet: "Service Date: 02/04/2026",
        page: 1,
        bbox: [40, 582, 300, 602]
      }
    }
  ],
  missing_fields: [],
  suggested_next_action: {
    action: "submit",
    reason: "Core fields and supporting docs appear complete."
  },
  audit_trail: [
    {
      key: "patient.name",
      label: "Patient Name",
      value: "Avery Patel",
      page: 1,
      bbox: [40, 120, 420, 140],
      snippet: "Patient Name: Avery Patel"
    },
    {
      key: "provider.npi",
      label: "NPI",
      value: "1234567890",
      page: 1,
      bbox: [40, 232, 240, 250],
      snippet: "NPI: 1234567890"
    },
    {
      key: "diagnosis.icd10",
      label: "ICD-10",
      value: "M05.79",
      page: 1,
      bbox: [40, 302, 220, 320],
      snippet: "ICD-10: M05.79"
    },
    {
      key: "procedure.cpt",
      label: "CPT",
      value: "96413",
      page: 1,
      bbox: [40, 372, 200, 390],
      snippet: "CPT: 96413"
    },
    {
      key: "drug.ndc",
      label: "NDC",
      value: "00006-4401-61",
      page: 1,
      bbox: [40, 442, 260, 460],
      snippet: "NDC: 00006-4401-61"
    }
  ]
};

export const demoIncompleteResponse: ExtractionResponse = {
  document: {
    filename: "sample_packet_missing.svg",
    file_type: "image",
    pages: 1,
    warnings: ["Demo data loaded locally."]
  },
  fields: [
    {
      section: "Patient",
      key: "patient.name",
      label: "Patient Name",
      value: "Jordan Rivera",
      confidence: 0.9,
      source: {
        snippet: "Patient Name: Jordan Rivera",
        page: 1,
        bbox: [40, 120, 420, 140]
      }
    },
    {
      section: "Patient",
      key: "patient.dob",
      label: "DOB",
      value: "11/22/1974",
      confidence: 0.86,
      source: {
        snippet: "DOB: 11/22/1974",
        page: 1,
        bbox: [40, 142, 280, 160]
      }
    },
    {
      section: "Patient",
      key: "patient.member_id",
      label: "Member ID",
      value: "AC-330128",
      confidence: 0.8,
      source: {
        snippet: "Member ID: AC-330128",
        page: 1,
        bbox: [40, 164, 300, 182]
      }
    },
    {
      section: "Provider",
      key: "provider.name",
      label: "Provider",
      value: "Dr. Lila Ahmed",
      confidence: 0.82,
      source: {
        snippet: "Provider: Dr. Lila Ahmed",
        page: 1,
        bbox: [40, 210, 420, 230]
      }
    },
    {
      section: "Provider",
      key: "provider.npi",
      label: "NPI",
      value: null,
      confidence: 0.0,
      source: null
    },
    {
      section: "Diagnosis",
      key: "diagnosis.description",
      label: "Diagnosis",
      value: "Severe asthma exacerbation",
      confidence: 0.72,
      source: {
        snippet: "Diagnosis: Severe asthma exacerbation",
        page: 1,
        bbox: [40, 280, 600, 300]
      }
    },
    {
      section: "Diagnosis",
      key: "diagnosis.icd10",
      label: "ICD-10",
      value: "J45.901",
      confidence: 0.76,
      source: {
        snippet: "ICD-10: J45.901",
        page: 1,
        bbox: [40, 302, 220, 320]
      }
    },
    {
      section: "Procedure",
      key: "procedure.description",
      label: "Procedure",
      value: "Pulmonary function testing",
      confidence: 0.68,
      source: {
        snippet: "Procedure: Pulmonary function testing",
        page: 1,
        bbox: [40, 350, 420, 370]
      }
    },
    {
      section: "Procedure",
      key: "procedure.cpt",
      label: "CPT",
      value: "94010",
      confidence: 0.62,
      source: {
        snippet: "CPT: 94010",
        page: 1,
        bbox: [40, 372, 200, 390]
      }
    },
    {
      section: "Drug",
      key: "drug.name",
      label: "Drug",
      value: "Dupilumab",
      confidence: 0.66,
      source: {
        snippet: "Drug: Dupilumab",
        page: 1,
        bbox: [40, 420, 300, 440]
      }
    },
    {
      section: "Drug",
      key: "drug.ndc",
      label: "NDC",
      value: null,
      confidence: 0.0,
      source: null
    },
    {
      section: "Payer",
      key: "payer.name",
      label: "Payer",
      value: "Atlas Health",
      confidence: 0.78,
      source: {
        snippet: "Payer: Atlas Health",
        page: 1,
        bbox: [40, 490, 320, 510]
      }
    },
    {
      section: "Plan",
      key: "plan.name",
      label: "Plan",
      value: "Atlas Health Silver HMO",
      confidence: 0.74,
      source: {
        snippet: "Plan: Atlas Health Silver HMO",
        page: 1,
        bbox: [40, 512, 420, 532]
      }
    },
    {
      section: "Dates",
      key: "dates.requested",
      label: "Requested Date",
      value: "02/01/2026",
      confidence: 0.6,
      source: {
        snippet: "Requested DOS: 02/01/2026",
        page: 1,
        bbox: [40, 560, 300, 580]
      }
    },
    {
      section: "Dates",
      key: "dates.service",
      label: "Service Date",
      value: null,
      confidence: 0.0,
      source: null
    }
  ],
  missing_fields: [
    "Provider NPI",
    "Drug NDC",
    "Chart notes",
    "Failed step therapy",
    "Labs from last 90 days",
    "Provider signature",
    "NPI mismatch"
  ],
  suggested_next_action: {
    action: "request_more_info",
    reason: "Missing fields and supporting documentation require follow-up."
  },
  audit_trail: [
    {
      key: "patient.name",
      label: "Patient Name",
      value: "Jordan Rivera",
      page: 1,
      bbox: [40, 120, 420, 140],
      snippet: "Patient Name: Jordan Rivera"
    },
    {
      key: "diagnosis.icd10",
      label: "ICD-10",
      value: "J45.901",
      page: 1,
      bbox: [40, 302, 220, 320],
      snippet: "ICD-10: J45.901"
    },
    {
      key: "procedure.cpt",
      label: "CPT",
      value: "94010",
      page: 1,
      bbox: [40, 372, 200, 390],
      snippet: "CPT: 94010"
    }
  ]
};
