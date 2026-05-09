const API_BASE = "http://localhost:3001";

// ─── Document Generation ──────────────────────────────────────────────────────

export interface GeneratedSection {
  id: string;
  title: string;
  clauseText: string;
  riskIndicator: "KEEP" | "REVIEW" | "HIGH ATTENTION";
  precedentSource: string;
  precedentSelectionReason: string;
  draftingCommentary: {
    whyExists: string;
    riskProtected: string;
    marketComparison: string;
  };
  relevanceScore: number;
}

export interface GeneratedDocument {
  documentType: string;
  sections: GeneratedSection[];
  executiveSummary: {
    precedentStrategy: string;
    draftingStrategy: string;
    keyNegotiationConsiderations: string;
  };
  alternativePrecedents: Array<{
    dealCodename: string;
    similarityRationale: string;
    whyNotSelected: string;
  }>;
  keyRisksForPartnerReview: string[];
}

export async function generateDocument(
  deal: Record<string, unknown>,
  documentType: string
): Promise<GeneratedDocument> {
  const res = await fetch(`${API_BASE}/api/generate-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal, documentType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json();
}

// ─── New Deal Analysis ────────────────────────────────────────────────────────

export interface NewDealAnalysis {
  dealCodename: string;
  industry: string;
  contractType: string;
  geography: string;
  estimatedDealSize: string;
  counterpartyName: string;
  dealSummary: string;
}

export async function analyzeNewDeal(documentText: string): Promise<NewDealAnalysis> {
  const res = await fetch(`${API_BASE}/api/analyze-new-deal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json();
}

export interface AnalyzedClause {
  id: string;
  title: string;
  originalText: string;
  relevanceScore: number;
  status: "keep" | "review" | "outdated";
  flagReason: string | null;
  suggestedAction: string;
  category: string;
}

export interface AnalyzeResponse {
  dealContext: string;
  clauses: AnalyzedClause[];
  summary: string;
  keyRisks: string[];
}

export async function analyzeDocument(
  documentText: string,
  dealContext?: string
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText, dealContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json();
}
