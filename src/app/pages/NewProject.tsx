import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { analyzeNewDeal } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealForm {
  dealCodename: string;
  industry: string;
  contractType: string;
  geography: string;
  estimatedDealSize: string;
  counterpartyName: string;
  teamMembers: string;
  additionalNotes: string;
  dealSummary: string;
}

const EMPTY_FORM: DealForm = {
  dealCodename: "",
  industry: "",
  contractType: "",
  geography: "",
  estimatedDealSize: "",
  counterpartyName: "",
  teamMembers: "",
  additionalNotes: "",
  dealSummary: "",
};

// ─── Option lists ─────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Technology", "Healthcare", "Financial Services", "Energy",
  "Real Estate", "Manufacturing", "Consumer Goods", "Other",
];

const DEAL_TYPES = [
  "Merger Agreement",
  "Share Purchase Agreement",
  "Asset Purchase Agreement",
  "Joint Venture Agreement",
  "Acquisition — Buy Side",
  "Acquisition — Sell Side",
  "Other",
];

const GEOGRAPHIES = [
  "North America", "Europe", "Asia Pacific",
  "Middle East", "Latin America", "Multi-jurisdictional",
];

const DEAL_SIZES = [
  "Under $10M", "$10M–$50M", "$50M–$250M", "$250M–$1B", "Over $1B",
];

const CONTRACT_TYPE_TO_DEAL_TYPE: Record<string, string> = {
  "Merger": "M&A",
  "Acquisition — Buy Side": "M&A",
  "Acquisition — Sell Side": "M&A",
  "Joint Venture": "M&A",
  "Asset Purchase": "M&A",
  "Share Purchase": "M&A",
  "Other": "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.onerror = () => resolve(`[Could not read: ${file.name}]`);
      reader.readAsText(file);
    } else {
      // For PDFs, images, PPT — pass the filename as context for the AI
      resolve(`[Document: ${file.name} — binary content, use filename and context clues]`);
    }
  });
}

function saveDealToStorage(form: DealForm) {
  const existing = JSON.parse(localStorage.getItem("structura_deals") ?? "[]");
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const newDeal = {
    id: Date.now(),
    name: form.dealCodename
      ? `${form.dealCodename}${form.counterpartyName ? ` — ${form.counterpartyName}` : ""}`
      : form.counterpartyName || "New Deal",
    type: CONTRACT_TYPE_TO_DEAL_TYPE[form.contractType] ?? "Other",
    status: "In Negotiation",
    risk: "Low",
    due: dueDate.toISOString().split("T")[0],
    progress: 0,
    starred: false,
    guaranteeClauses: 0,
    industry: form.industry,
    geography: form.geography,
    estimatedDealSize: form.estimatedDealSize,
    teamMembers: form.teamMembers,
    dealSummary: form.dealSummary,
    additionalNotes: form.additionalNotes,
  };

  localStorage.setItem("structura_deals", JSON.stringify([newDeal, ...existing]));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AiTag() {
  return (
    <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-xs font-semibold">
      <Sparkles className="h-3 w-3" />
      AI
    </span>
  );
}

function FieldLabel({
  htmlFor, children, optional, aiField, analyzed,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
  aiField?: boolean;
  analyzed?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2"
      style={{ fontSize: "16px" }}
    >
      {children}
      {aiField && !analyzed && <AiTag />}
      {optional && <span className="ml-2 text-sm font-normal text-slate-400">(optional)</span>}
    </label>
  );
}

function SelectField({
  id, value, onChange, options, placeholder, disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border transition-colors",
        "px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500",
        "appearance-none",
        disabled
          ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
      )}
      style={{ minHeight: "48px", fontSize: "15px" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewProject() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [form, setForm] = useState<DealForm>(EMPTY_FORM);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── File handling ────────────────────────────────────────────────────────────

  const ACCEPTED = ["application/pdf", "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png", "image/jpeg"];

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => ACCEPTED.includes(f.type) || f.name.match(/\.(pdf|ppt|pptx|png|jpg|jpeg)$/i)
    );
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  }, []);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // ── Analysis ─────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const texts = await Promise.all(files.map(readFileAsText));
      const combinedText = texts.join("\n\n---\n\n");
      const result = await analyzeNewDeal(combinedText);

      setForm({
        dealCodename: result.dealCodename ?? "",
        industry: result.industry ?? "",
        contractType: result.contractType ?? "",
        geography: result.geography ?? "",
        estimatedDealSize: result.estimatedDealSize ?? "",
        counterpartyName: result.counterpartyName ?? "",
        teamMembers: "",
        additionalNotes: "",
        dealSummary: result.dealSummary ?? "",
      });
      setAnalyzed(true);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Submission ────────────────────────────────────────────────────────────────

  const handleCreate = () => {
    saveDealToStorage(form);
    setIsSuccess(true);
    setTimeout(() => navigate("/active-deals"), 2000);
  };

  const setField = (key: keyof DealForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Your deal has been created.
        </p>
        <p className="text-base text-slate-500">Taking you to Active Deals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

      {/* Page heading */}
      <div>
        <h1 className="font-bold text-slate-900 dark:text-white" style={{ fontSize: "26px" }}>
          Start a New Deal
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400" style={{ fontSize: "15px" }}>
          Upload your deal documents and we'll read them to pre-fill the details below.
        </p>
      </div>

      {/* ── STEP 1: Upload ── */}
      <section className="space-y-5">
        <div className="flex items-center space-x-3">
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex-shrink-0">
            1
          </span>
          <h2 className="font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: "20px" }}>
            Upload Documents
          </h2>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="File upload area"
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed",
            "cursor-pointer transition-all duration-200 select-none",
            "py-14 px-8 text-center",
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/30"
          )}
        >
          <Upload className="h-12 w-12 text-slate-400 mb-4" strokeWidth={1.5} />
          <p className="font-semibold text-slate-700 dark:text-slate-200" style={{ fontSize: "18px" }}>
            Drop your CIM or deal documents here
          </p>
          <p className="mt-2 text-slate-400 dark:text-slate-500" style={{ fontSize: "14px" }}>
            Accepted formats: PDF, PowerPoint, Images — or click to browse
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />

        {/* File pills */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium"
              >
                <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                  className="ml-1 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {analysisError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p style={{ fontSize: "15px" }}>{analysisError}</p>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={files.length === 0 || isAnalyzing}
          className={cn(
            "w-full rounded-xl font-semibold text-white transition-all duration-200",
            "flex items-center justify-center gap-3",
            files.length === 0 || isAnalyzing
              ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-sm"
          )}
          style={{ minHeight: "52px", fontSize: "16px" }}
        >
          {isAnalyzing ? (
            <>
              <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Structura is reading your documents...
            </>
          ) : (
            "Analyze Documents"
          )}
        </button>
      </section>

      {/* ── STEP 2: Deal details (always visible) ── */}
      <section className="space-y-8">
        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center space-x-3">
          <span className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-sm flex-shrink-0",
            analyzed ? "bg-green-600" : "bg-slate-400 dark:bg-slate-600"
          )}>
            2
          </span>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: "20px" }}>
              {analyzed ? "Deal Details — Please confirm the information below" : "Deal Details"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: "14px" }}>
              {analyzed
                ? "We've filled this in based on your documents. Please review and correct anything that looks wrong."
                : "Fields marked with AI will be filled in automatically after you analyze your documents."}
            </p>
          </div>
        </div>

        {/* AI summary banner — shown after analysis */}
        {analyzed && form.dealSummary && (
          <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
              Structura's Summary
            </p>
            <p className="text-slate-700 dark:text-slate-300" style={{ fontSize: "15px" }}>
              {form.dealSummary}
            </p>
          </div>
        )}

        <div className="space-y-7">

          {/* Deal Codename */}
          <div>
            <FieldLabel htmlFor="dealCodename" aiField analyzed={analyzed}>Deal Codename</FieldLabel>
            <input
              id="dealCodename"
              type="text"
              value={form.dealCodename}
              onChange={(e) => setField("dealCodename")(e.target.value)}
              disabled={!analyzed}
              placeholder={analyzed ? "e.g. Project Falcon" : "Waiting for document analysis..."}
              className={cn(
                "w-full rounded-xl border transition-colors",
                "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500",
                !analyzed
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              )}
              style={{ minHeight: "48px", fontSize: "15px" }}
            />
          </div>

          {/* Industry */}
          <div>
            <FieldLabel htmlFor="industry" aiField analyzed={analyzed}>Industry</FieldLabel>
            <SelectField
              id="industry"
              value={form.industry}
              onChange={setField("industry")}
              options={INDUSTRIES}
              placeholder={analyzed ? "Select an industry" : "Waiting for document analysis..."}
              disabled={!analyzed}
            />
          </div>

          {/* Deal Type */}
          <div>
            <FieldLabel htmlFor="contractType" aiField analyzed={analyzed}>Deal Type</FieldLabel>
            <SelectField
              id="contractType"
              value={form.contractType}
              onChange={setField("contractType")}
              options={DEAL_TYPES}
              placeholder={analyzed ? "Select a deal type" : "Waiting for document analysis..."}
              disabled={!analyzed}
            />
          </div>

          {/* Geography */}
          <div>
            <FieldLabel htmlFor="geography" aiField analyzed={analyzed}>Geography</FieldLabel>
            <SelectField
              id="geography"
              value={form.geography}
              onChange={setField("geography")}
              options={GEOGRAPHIES}
              placeholder={analyzed ? "Select a geography" : "Waiting for document analysis..."}
              disabled={!analyzed}
            />
          </div>

          {/* Estimated Deal Size */}
          <div>
            <FieldLabel htmlFor="estimatedDealSize" aiField analyzed={analyzed}>Estimated Deal Size</FieldLabel>
            <SelectField
              id="estimatedDealSize"
              value={form.estimatedDealSize}
              onChange={setField("estimatedDealSize")}
              options={DEAL_SIZES}
              placeholder={analyzed ? "Select a range" : "Waiting for document analysis..."}
              disabled={!analyzed}
            />
          </div>

          {/* Counterparty Name */}
          <div>
            <FieldLabel htmlFor="counterpartyName" aiField analyzed={analyzed}>Counterparty Name</FieldLabel>
            <input
              id="counterpartyName"
              type="text"
              value={form.counterpartyName}
              onChange={(e) => setField("counterpartyName")(e.target.value)}
              disabled={!analyzed}
              placeholder={analyzed ? "e.g. Acme Corporation" : "Waiting for document analysis..."}
              className={cn(
                "w-full rounded-xl border transition-colors",
                "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500",
                !analyzed
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              )}
              style={{ minHeight: "48px", fontSize: "15px" }}
            />
          </div>

          {/* Assigned Team Members — always editable */}
          <div>
            <FieldLabel htmlFor="teamMembers">Assigned Team Members</FieldLabel>
            <input
              id="teamMembers"
              type="text"
              value={form.teamMembers}
              onChange={(e) => setField("teamMembers")(e.target.value)}
              placeholder="e.g. Sarah Chen, James Morton"
              className={cn(
                "w-full rounded-xl border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100",
                "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              style={{ minHeight: "48px", fontSize: "15px" }}
            />
            <p className="mt-1.5 text-slate-400 dark:text-slate-500" style={{ fontSize: "13px" }}>
              Separate multiple names with commas
            </p>
          </div>

          {/* Additional Notes — always editable */}
          <div>
            <FieldLabel htmlFor="additionalNotes" optional>Additional Notes</FieldLabel>
            <textarea
              id="additionalNotes"
              value={form.additionalNotes}
              onChange={(e) => setField("additionalNotes")(e.target.value)}
              rows={4}
              placeholder="Any context Structura may have missed — deal dynamics, special considerations, etc."
              className={cn(
                "w-full rounded-xl border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100",
                "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              )}
              style={{ fontSize: "15px" }}
            />
          </div>
        </div>

        {/* Create Deal button */}
        <button
          onClick={handleCreate}
          disabled={!analyzed}
          className={cn(
            "w-full rounded-xl font-semibold transition-all duration-200",
            "flex items-center justify-center gap-2",
            analyzed
              ? "text-white bg-green-600 hover:bg-green-700 active:scale-[0.99] shadow-sm"
              : "text-slate-400 bg-slate-200 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed"
          )}
          style={{ minHeight: "56px", fontSize: "17px" }}
        >
          <CheckCircle2 className="h-5 w-5" />
          Create Deal
        </button>
      </section>
    </div>
  );
}
