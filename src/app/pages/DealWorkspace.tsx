import { useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router";
import {
  AlertTriangle,
  Info,
  MessageSquare,
  Check,
  History,
  ChevronRight,
  Sparkles,
  GitCommit,
  ArrowRightLeft,
  FileText,
  Scale,
} from "lucide-react";
import { cn } from "../lib/utils";
import { generateDocument } from "@/lib/api";
import type { GeneratedDocument } from "@/lib/api";
import { DocTypeSelector } from "./DealWorkspace/DocTypeSelector";
import { GeneratingScreen } from "./DealWorkspace/GeneratingScreen";
import { GeneratedDocWorkspace } from "./DealWorkspace/GeneratedDocWorkspace";

// ─── State machine ────────────────────────────────────────────────────────────

type ViewState = "legacy" | "selecting" | "generating" | "workspace";

// ─── Mock Data (legacy workspace only) ───────────────────────────────────────

const mockClauses = [
  {
    id: "c1",
    title: "1.2 Purchase Price",
    content:
      "The aggregate purchase price for the Acquired Assets shall be $50,000,000, payable in cash at Closing.",
    status: "agreed",
    risk: "low",
  },
  {
    id: "c2",
    title: "8.4 Indemnification Cap",
    content:
      "The maximum aggregate liability of the Seller for all claims under Section 8.2(a) shall not exceed ",
    redline: {
      deleted: "twenty percent (20%)",
      added: "ten percent (10%)",
    },
    suffix: " of the Purchase Price.",
    status: "redlined",
    risk: "high",
    explanation:
      "Buyer narrowed the indemnification cap from 20% to 10%, significantly reducing seller's post-closing exposure. Market standard for similar mid-market software acquisitions is 15%.",
    marketStandard: "15%",
    suggestion:
      "Counter at 15% to align with market standard while still conceding ground from initial 20% position.",
  },
  {
    id: "c3",
    title: "9.1 Survival Period",
    content:
      "The representations and warranties of the Seller contained in Article 3 shall survive the Closing for a period of ",
    redline: {
      deleted: "twenty-four (24)",
      added: "twelve (12)",
    },
    suffix: " months.",
    status: "redlined",
    risk: "medium",
    explanation:
      "Buyer reduced the survival period, which accelerates the release of escrow funds. This is favorable to us, but they may use this concession to negotiate the Indemnification Cap.",
    marketStandard: "18 months",
    suggestion:
      "Accept this edit. It is below market median (18mo) and highly favorable to Seller.",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function DealWorkspace() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

  // Load deal from localStorage (user-created deals only)
  const storedDeal = useMemo(() => {
    try {
      const deals = JSON.parse(localStorage.getItem("structura_deals") ?? "[]");
      return (deals as Record<string, unknown>[]).find((d) => d.id === numId) ?? null;
    } catch {
      return null;
    }
  }, [numId]);

  // Load previously generated doc if it exists
  const storedDoc = useMemo((): GeneratedDocument | null => {
    try {
      const raw = localStorage.getItem(`structura_doc_${numId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [numId]);

  // Derive initial view state
  const initialViewState = useMemo((): ViewState => {
    if (!storedDeal) return "legacy";
    if (storedDoc) return "workspace";
    return "selecting";
  }, [storedDeal, storedDoc]);

  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(storedDoc);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async (docType: string) => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSelectedDocType(docType);
    setGenerateError(null);
    setViewState("generating");
    try {
      const doc = await generateDocument(
        storedDeal as Record<string, unknown>,
        docType
      );
      if (controller.signal.aborted) return;
      localStorage.setItem(`structura_doc_${numId}`, JSON.stringify(doc));
      setGeneratedDoc(doc);
      setViewState("workspace");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Document generation failed:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGenerateError(msg);
      setViewState("selecting");
    }
  }, [storedDeal, numId]);

  const handleRetry = useCallback(() => {
    if (selectedDocType) handleGenerate(selectedDocType);
  }, [selectedDocType, handleGenerate]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setViewState("selecting");
  }, []);

  // ── Conditional rendering ──────────────────────────────────────────────────

  if (viewState === "selecting" && storedDeal) {
    return (
      <DocTypeSelector
        deal={storedDeal as Parameters<typeof DocTypeSelector>[0]["deal"]}
        onGenerate={handleGenerate}
        error={generateError}
      />
    );
  }

  if (viewState === "generating") {
    return (
      <GeneratingScreen
        docType={selectedDocType}
        dealName={(storedDeal as { name?: string })?.name ?? ""}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
    );
  }

  if (viewState === "workspace" && generatedDoc && storedDeal) {
    return (
      <GeneratedDocWorkspace
        doc={generatedDoc}
        deal={storedDeal as Parameters<typeof GeneratedDocWorkspace>[0]["deal"]}
      />
    );
  }

  // ── Legacy workspace (seeded deal id=1) ───────────────────────────────────
  return <LegacyWorkspace />;
}

// ─── Legacy Workspace (Shopify / seeded deal) ─────────────────────────────────

function LegacyWorkspace() {
  const [activeClause, setActiveClause] = useState<string | null>("c2");
  const [activeTab, setActiveTab] = useState<"copilot" | "power">("copilot");

  const selectedClauseData = mockClauses.find((c) => c.id === activeClause);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Left: Document View */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">
        <div className="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">
              Asset Purchase Agreement v4.docx
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200">
              Pending Counterparty
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm transition-all">
              <History className="h-4 w-4 mr-2" /> Version History
            </button>
            <button className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-md shadow-sm transition-all">
              Export Clean
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-10 lg:px-24 py-12">
          <div className="max-w-3xl mx-auto space-y-12 text-slate-800">
            <div className="text-center mb-16">
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
                Asset Purchase Agreement
              </h1>
              <p className="text-slate-500 italic text-sm">Drafted: May 9, 2026</p>
            </div>

            {mockClauses.map((clause) => (
              <div
                key={clause.id}
                className={cn(
                  "relative group cursor-pointer rounded-lg p-4 -mx-4 transition-all duration-200 border border-transparent",
                  activeClause === clause.id
                    ? "bg-indigo-50/50 border-indigo-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                    : "hover:bg-slate-50"
                )}
                onClick={() => {
                  setActiveClause(clause.id);
                  setActiveTab("copilot");
                }}
              >
                {activeClause === clause.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg" />
                )}

                <h3 className="font-bold mb-3 flex items-center justify-between text-slate-900">
                  {clause.title}
                  {clause.risk === "high" && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </h3>

                <div className="text-[15px] leading-relaxed font-serif">
                  {clause.content}
                  {clause.redline && (
                    <>
                      <span className="line-through text-red-500 bg-red-50 px-1 mx-1 rounded decoration-red-500/50">
                        {clause.redline.deleted}
                      </span>
                      <span className="text-green-700 bg-green-50 px-1 mx-1 rounded border-b border-green-300">
                        {clause.redline.added}
                      </span>
                    </>
                  )}
                  {clause.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: AI Intelligence Panel */}
      <div className="w-[450px] flex flex-col bg-slate-50">
        {/* Tabs */}
        <div className="flex p-4 space-x-3 bg-white/50 border-b border-slate-200 backdrop-blur-sm">
          {[
            {
              id: "copilot",
              label: "AI Co-Pilot",
              icon: Sparkles,
              description: "Clause analysis & recommendations",
            },
            {
              id: "power",
              label: "Leverage Analysis",
              icon: Scale,
              description: "Power dynamics & guarantee tracking",
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "copilot" | "power")}
              className={cn(
                "flex-1 flex flex-col items-start justify-center py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200",
                activeTab === t.id
                  ? "bg-gradient-to-br from-blue-50 to-green-50/50 text-blue-700 shadow-[inset_0_0_0_2px_#bfdbfe] scale-[1.02]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/80"
              )}
            >
              <div className="flex items-center space-x-2 mb-1">
                <t.icon
                  className={cn(
                    "h-4 w-4",
                    activeTab === t.id ? "text-blue-600" : "text-slate-400"
                  )}
                />
                <span>{t.label}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  activeTab === t.id ? "text-blue-600/70" : "text-slate-400"
                )}
              >
                {t.description}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-white/40 backdrop-blur-md">
          {/* AI CO-PILOT TAB */}
          {activeTab === "copilot" && (
            <div className="p-6 space-y-6">
              {!selectedClauseData || !selectedClauseData.redline ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Check className="h-12 w-12 text-slate-300 mb-4" />
                  <p>Select a redlined clause to view analysis.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Selected Clause
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium border",
                          selectedClauseData.risk === "high"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {selectedClauseData.risk.toUpperCase()} RISK
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 text-lg">
                      {selectedClauseData.title}
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                    <h4 className="flex items-center text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
                      <Info className="h-4 w-4 text-blue-500 mr-2" /> Redline Explainer
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {selectedClauseData.explanation}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center uppercase tracking-wide">
                      <GitCommit className="h-4 w-4 text-slate-500 mr-2" /> Market Benchmark
                    </h4>
                    <div className="flex items-end justify-between mb-4">
                      <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {selectedClauseData.marketStandard}
                      </div>
                      <div className="text-xs font-bold text-slate-500 mb-1 uppercase">
                        Median (last 24 mo)
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="relative w-full h-3">
                        <div
                          className="absolute left-[10%] w-3 h-5 -top-1 bg-orange-500 rounded shadow-sm z-10"
                          title="Buyer's Ask (10%)"
                        />
                        <div
                          className="absolute left-[15%] w-4 h-5 -top-1 bg-slate-800 rounded shadow-sm z-20"
                          title="Market (15%)"
                        />
                        <div
                          className="absolute left-[20%] w-3 h-5 -top-1 bg-blue-500 rounded shadow-sm z-10"
                          title="Our Ask (20%)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                      <span>0%</span>
                      <span className="ml-8 text-orange-600">Buyer</span>
                      <span className="text-slate-800">Market</span>
                      <span className="text-blue-600">Us</span>
                      <span>25%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
                      <MessageSquare className="h-4 w-4 text-slate-500 mr-2" /> Suggested Action
                    </h4>
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-5 rounded-2xl border border-blue-100">
                      <p className="text-sm font-medium text-slate-800 mb-5">
                        {selectedClauseData.suggestion}
                      </p>
                      <div className="flex space-x-3">
                        <button className="flex-1 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm flex justify-center items-center">
                          <Sparkles className="h-4 w-4 mr-2" /> Apply Market Standard
                        </button>
                        <button className="px-4 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold">
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
                      <ArrowRightLeft className="h-4 w-4 text-slate-500 mr-2" /> Key Negotiation
                      Gaps
                    </h4>
                    <div className="space-y-2">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-red-800">Governing Law</span>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-red-100 text-red-700 rounded uppercase">
                            Conflict
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-red-700">
                          <span className="font-medium">Us: Delaware</span>
                          <ChevronRight className="h-3 w-3 mx-1" />
                          <span className="font-medium">Them: California</span>
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-amber-800">
                            Indemnification Cap
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded uppercase">
                            Negotiating
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-amber-700">
                          <span className="font-medium">Us: 20%</span>
                          <ChevronRight className="h-3 w-3 mx-1" />
                          <span className="font-medium">Them: 10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* LEVERAGE / POWER DYNAMICS TAB */}
          {activeTab === "power" && (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Power Dynamics: Guarantee Analysis
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Analysis of structural power imbalances based on the presence of Guarantee
                  Clauses. An excess of guarantee clauses inherently shifts the risk and leverage in
                  favor of the counterparty.
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Guarantee Clauses Detected
                    </h4>
                    <div className="text-4xl font-black text-slate-900">4</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider mb-1">
                      High Counterparty Leverage
                    </span>
                    <p className="text-xs font-bold text-slate-500">
                      Contract heavily favors Counterparty
                    </p>
                  </div>
                </div>

                <div className="relative pt-6 pb-2">
                  <div className="flex w-full h-4 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                    <div className="w-1/3 bg-blue-500/20 border-r border-white/50" />
                    <div className="w-1/3 bg-yellow-400/30 border-r border-white/50" />
                    <div className="w-1/3 bg-orange-500/40" />
                  </div>
                  <div className="absolute top-0 w-full flex justify-between px-2 text-[10px] font-bold text-slate-400">
                    {["0-1", "2-3", "4+"].map((label) => (
                      <div key={label} className="flex flex-col items-center">
                        <span>{label}</span>
                        <div className="h-2 w-px bg-slate-300 mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-[80%] -translate-x-1/2 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-800 mb-1 drop-shadow-md" />
                    <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-bold uppercase mt-4">
                  <span className="text-blue-600">Favorable to Us</span>
                  <span className="text-yellow-600">Neutral</span>
                  <span className="text-orange-600">Favorable to Them</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                  Identified Guarantee Clauses
                </h4>
                <div className="space-y-3">
                  <PowerFactor
                    title="Performance Guarantee (Clause 4.2)"
                    desc="Unconditional guarantee of uptime SLA without standard force majeure exclusions."
                    advantage="them"
                  />
                  <PowerFactor
                    title="Financial Guarantee (Clause 7.1)"
                    desc="Requirement for parent company to unconditionally back financial liabilities of the subsidiary."
                    advantage="them"
                  />
                  <PowerFactor
                    title="IP Indemnification Guarantee (Clause 9.3)"
                    desc="Absolute guarantee against any third-party IP claims, overriding standard limitations of liability."
                    advantage="them"
                  />
                  <PowerFactor
                    title="Data Integrity Guarantee (Clause 11.2)"
                    desc="Guarantee of zero data loss under all circumstances, an uninsurable risk."
                    advantage="them"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PowerFactor({
  title,
  desc,
  advantage,
}: {
  title: string;
  desc: string;
  advantage: "us" | "them" | "neutral";
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
      <div
        className={cn(
          "mt-0.5 w-2 h-2 rounded-full flex-shrink-0",
          advantage === "us"
            ? "bg-blue-500"
            : advantage === "them"
            ? "bg-orange-500"
            : "bg-slate-400"
        )}
      />
      <div>
        <h5 className="text-sm font-bold text-slate-800 mb-1">{title}</h5>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
