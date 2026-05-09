import { useState } from "react";
import {
  FileText,
  Download,
  BookOpen,
  AlertTriangle,
  BarChart2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { GeneratedDocument, GeneratedSection } from "@/lib/api";

interface Deal {
  name: string;
  [key: string]: unknown;
}

interface GeneratedDocWorkspaceProps {
  doc: GeneratedDocument;
  deal: Deal;
}

type RightTab = "intel" | "summary" | "risks";

function riskBadgeClass(r: string) {
  if (r === "KEEP") return "bg-green-100 text-green-700 border-green-200";
  if (r === "HIGH ATTENTION") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export function GeneratedDocWorkspace({ doc, deal }: GeneratedDocWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    doc.sections[0]?.id ?? null
  );
  const [rightTab, setRightTab] = useState<RightTab>("intel");

  const selected = doc.sections.find((s) => s.id === activeSection);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Left: Document View */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">
        {/* Header */}
        <div className="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <FileText className="h-5 w-5 text-blue-700 flex-shrink-0" />
            <h2 className="font-semibold text-slate-800 truncate">{doc.documentType}</h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200 flex-shrink-0">
              AI First Draft — v1.0
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 truncate max-w-[180px]">
              {deal.name}
            </span>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm transition-all">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
          </div>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-auto p-10 lg:px-24 py-12">
          <div className="max-w-3xl mx-auto space-y-10 text-slate-800">
            <div className="text-center mb-12">
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">
                {doc.documentType}
              </h1>
              <p className="text-slate-500 font-medium text-sm">{deal.name}</p>
              <p className="text-slate-400 italic text-sm mt-1">
                AI First Draft —{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {doc.sections.map((section) => (
              <div
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setRightTab("intel");
                }}
                className={cn(
                  "relative group cursor-pointer rounded-lg p-4 -mx-4 transition-all duration-200 border",
                  activeSection === section.id
                    ? "bg-blue-50/60 border-blue-200 shadow-sm"
                    : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                )}
              >
                {activeSection === section.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-l-lg" />
                )}

                <div className="flex items-start justify-between mb-2 gap-3">
                  <h3 className="font-bold text-slate-900">{section.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                      {section.relevanceScore}% match
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold border",
                        riskBadgeClass(section.riskIndicator)
                      )}
                    >
                      {section.riskIndicator}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-blue-700 font-semibold mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 flex-shrink-0" />
                  {section.precedentSource}
                </p>

                <div className="text-[14px] leading-relaxed font-serif text-slate-700 whitespace-pre-wrap">
                  {section.clauseText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Intelligence Panel */}
      <div className="w-[480px] flex flex-col bg-slate-50 flex-shrink-0">
        {/* Tabs */}
        <div className="flex p-3 gap-2 bg-white/50 border-b border-slate-200 backdrop-blur-sm flex-shrink-0">
          {(
            [
              { id: "intel" as RightTab, label: "Drafting Intel", icon: Sparkles },
              { id: "summary" as RightTab, label: "Executive Summary", icon: BarChart2 },
              { id: "risks" as RightTab, label: "Key Risks", icon: AlertTriangle },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRightTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all",
                rightTab === tab.id
                  ? "bg-blue-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              <tab.icon className="h-3.5 w-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {rightTab === "intel" && <DraftingIntelPanel section={selected} />}
          {rightTab === "summary" && (
            <ExecutiveSummaryPanel summary={doc.executiveSummary} />
          )}
          {rightTab === "risks" && (
            <KeyRisksPanel
              risks={doc.keyRisksForPartnerReview}
              alternatives={doc.alternativePrecedents}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function DraftingIntelPanel({ section }: { section?: GeneratedSection }) {
  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-8">
        <p className="text-center text-sm font-medium">
          Select a clause on the left to view its drafting intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Clause header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selected Clause
          </h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-bold border",
              riskBadgeClass(section.riskIndicator)
            )}
          >
            {section.riskIndicator}
          </span>
        </div>
        <p className="font-bold text-slate-900 text-base">{section.title}</p>
      </div>

      {/* Precedent Source */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Precedent Source
        </h4>
        <p className="font-bold text-blue-900 text-sm mb-2">{section.precedentSource}</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          {section.precedentSelectionReason}
        </p>
      </div>

      {/* Relevance Score */}
      <div>
        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
          <span>Precedent Relevance Score</span>
          <span className="text-blue-700">{section.relevanceScore}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-blue-700 transition-all"
            style={{ width: `${section.relevanceScore}%` }}
          />
        </div>
      </div>

      {/* Drafting Commentary */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Drafting Commentary
        </h4>
        {[
          { label: "Why It Exists", value: section.draftingCommentary.whyExists },
          { label: "Risk Protected", value: section.draftingCommentary.riskProtected },
          { label: "Market Comparison", value: section.draftingCommentary.marketComparison },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {label}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutiveSummaryPanel({
  summary,
}: {
  summary: GeneratedDocument["executiveSummary"];
}) {
  return (
    <div className="p-6 space-y-5">
      <h3 className="font-bold text-slate-900 text-lg">Executive Summary</h3>
      {[
        { label: "Precedent Strategy", value: summary.precedentStrategy, highlight: false },
        { label: "Drafting Strategy", value: summary.draftingStrategy, highlight: false },
        {
          label: "Key Negotiation Considerations",
          value: summary.keyNegotiationConsiderations,
          highlight: true,
        },
      ].map(({ label, value, highlight }) => (
        <div
          key={label}
          className={cn(
            "rounded-xl p-5 border",
            highlight
              ? "bg-blue-50 border-blue-100"
              : "bg-white border-slate-200"
          )}
        >
          <h4
            className={cn(
              "text-xs font-bold uppercase tracking-wide mb-2",
              highlight ? "text-blue-700" : "text-slate-400"
            )}
          >
            {label}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  );
}

function KeyRisksPanel({
  risks,
  alternatives,
}: {
  risks: string[];
  alternatives: GeneratedDocument["alternativePrecedents"];
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Partner review risks */}
      <div>
        <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Key Risks for Partner Review
        </h3>
        <div className="space-y-2">
          {risks.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3"
            >
              <span className="text-xs font-black text-red-400 mt-0.5 flex-shrink-0">{i + 1}</span>
              <p className="text-sm text-red-800 font-medium leading-relaxed">{risk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative precedents */}
      {alternatives.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 text-base mb-3">
            Alternative Precedents Considered
          </h3>
          <div className="space-y-3">
            {alternatives.map((alt, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="font-bold text-slate-800 text-sm mb-1">{alt.dealCodename}</p>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  {alt.similarityRationale}
                </p>
                <div className="flex items-start gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    {alt.whyNotSelected}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
