import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function askClaude(systemPrompt, userContent) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });
  const text = response.content[0].text.trim();
  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

// ─── Clause Analysis ──────────────────────────────────────────────────────────

const ANALYZE_SYSTEM_PROMPT = `You are a legal AI assistant embedded in Structura, a contract negotiation tool for M&A law firms.
When given document text and deal context, analyze the content and return ONLY valid JSON — no markdown, no explanation — in this exact structure:
{
  "dealContext": "<string>",
  "clauses": [
    {
      "id": "<string>",
      "title": "<string>",
      "originalText": "<string>",
      "relevanceScore": <number 0-100>,
      "status": "keep" | "review" | "outdated",
      "flagReason": "<string or null>",
      "suggestedAction": "<string>",
      "category": "<string>"
    }
  ],
  "summary": "<string>",
  "keyRisks": ["<string>"]
}`;

app.post("/api/analyze", async (req, res) => {
  const { documentText, dealContext } = req.body;
  if (!documentText) return res.status(400).json({ error: "documentText is required" });

  try {
    const json = await askClaude(
      ANALYZE_SYSTEM_PROMPT,
      `Deal context: ${dealContext || "Not provided"}\n\nDocument text:\n${documentText}`
    );
    res.json(json);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(502).json({ error: "Claude returned malformed JSON", details: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── New Deal Analysis ────────────────────────────────────────────────────────

const NEW_DEAL_SYSTEM_PROMPT = `You are a legal AI assistant helping lawyers at an M&A law firm set up a new deal file.
Based on the uploaded documents, extract and return a JSON object with these fields:
- dealCodename: suggest a two-word project name (e.g. "Project Falcon")
- industry: must be exactly one of: Technology, Healthcare, Financial Services, Energy, Real Estate, Manufacturing, Consumer Goods, Other
- contractType: must be exactly one of: Merger Agreement, Share Purchase Agreement, Asset Purchase Agreement, Joint Venture Agreement, Acquisition — Buy Side, Acquisition — Sell Side, Other
- geography: must be exactly one of: North America, Europe, Asia Pacific, Middle East, Latin America, Multi-jurisdictional
- estimatedDealSize: must be exactly one of: Under $10M, $10M–$50M, $50M–$250M, $250M–$1B, Over $1B
- counterpartyName: the name of the other party in the deal, or empty string if unknown
- dealSummary: 2-3 sentences max, plain English description of the deal

Return only valid JSON, no markdown, no explanation. If a field cannot be determined from the documents, use an empty string.`;

app.post("/api/analyze-new-deal", async (req, res) => {
  const { documentText } = req.body;
  if (!documentText) return res.status(400).json({ error: "documentText is required" });

  try {
    const json = await askClaude(
      NEW_DEAL_SYSTEM_PROMPT,
      `Document text:\n${documentText}`
    );
    res.json(json);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(502).json({ error: "Claude returned malformed JSON", details: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── Document Generation ──────────────────────────────────────────────────────

const GENERATE_DOCUMENT_SYSTEM_PROMPT = `You are Structura AI, an elite legal drafting assistant embedded in a leading M&A law firm's contract management platform. You have access to a deep institutional precedent library of historical closed deals.

Your task: Given a deal's metadata and a requested document type, draft a complete, institutionally-quality legal document. Simulate searching your precedent library to identify the most relevant historical deal, then draft each section informed by that precedent.

Return ONLY valid JSON — no markdown fences, no explanation — in this exact structure:
{
  "documentType": "<LOI|SPA|Due Diligence Request List>",
  "sections": [
    {
      "id": "<s1, s2, etc.>",
      "title": "<section title>",
      "clauseText": "<full drafted clause text — 2 to 5 substantive paragraphs of real legal language, professionally worded as if by a senior M&A attorney>",
      "riskIndicator": "<KEEP|REVIEW|HIGH ATTENTION>",
      "precedentSource": "<deal codename and year, e.g. Project Falcon (2024)>",
      "precedentSelectionReason": "<why this specific precedent clause was selected for this deal>",
      "draftingCommentary": {
        "whyExists": "<why this clause exists in the document and what purpose it serves>",
        "riskProtected": "<specific legal or commercial risk this clause protects against>",
        "marketComparison": "<how this clause compares to current market standard for this deal type/size/geography>"
      },
      "relevanceScore": <integer 0-100>
    }
  ],
  "executiveSummary": {
    "precedentStrategy": "<overall precedent selection strategy — why this primary precedent was chosen for this deal>",
    "draftingStrategy": "<overall drafting philosophy and approach taken for this document>",
    "keyNegotiationConsiderations": "<the 3-5 most important negotiation points the legal team should focus on>"
  },
  "alternativePrecedents": [
    {
      "dealCodename": "<deal codename>",
      "similarityRationale": "<why this deal was considered — similarities in structure, industry, size>",
      "whyNotSelected": "<specific reason the primary precedent was chosen over this one>"
    }
  ],
  "keyRisksForPartnerReview": ["<specific legal risk requiring partner attention>"]
}

Section requirements by document type:
- LOI: 6-8 sections covering Parties & Recitals, Purchase Price & Consideration, Exclusivity Period, Due Diligence, Conditions to Closing, Confidentiality, Termination Rights, Governing Law.
- SPA: 10-12 sections covering Definitions, Purchase & Sale, Purchase Price & Adjustment Mechanism, Representations & Warranties (Seller), Representations & Warranties (Buyer), Pre-Closing Covenants, Conditions to Closing, Indemnification Obligations, Limitation of Liability, Survival Period, Termination, Governing Law & Dispute Resolution.
- Due Diligence Request List: 8-10 sections covering Corporate & Organizational Matters, Financial Information & Audits, Material Contracts & Commitments, Intellectual Property, Employment & Labor, Litigation & Regulatory Compliance, Real Property & Assets, Tax Matters, Environmental Compliance, Insurance Policies.

Critical: clauseText must be substantive legal language (not placeholder text). Each clause should read as a real contract section.`;

app.post("/api/generate-document", async (req, res) => {
  const { deal, documentType } = req.body;
  if (!deal || !documentType) {
    return res.status(400).json({ error: "deal and documentType are required" });
  }

  const dealContext = `Deal Codename: ${deal.name}
Industry: ${deal.industry || "Not specified"}
Geography: ${deal.geography || "Not specified"}
Estimated Deal Size: ${deal.estimatedDealSize || "Not specified"}
Counterparty: ${deal.counterpartyName || "Not specified"}
Deal Type: ${deal.type || "M&A"}
Deal Summary: ${deal.dealSummary || "Not provided"}
Additional Notes: ${deal.additionalNotes || "None"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: GENERATE_DOCUMENT_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Please generate a complete ${documentType} for the following deal:\n\n${dealContext}`
      }],
    });
    const text = response.content[0].text.trim();
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const json = JSON.parse(cleaned);
    res.json(json);
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(502).json({ error: "Claude returned malformed JSON", details: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Structura API server running on http://localhost:${PORT}`);
});
