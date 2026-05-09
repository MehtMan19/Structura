import { useState } from "react";
import { FileSignature, Scale, ClipboardList, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface Deal {
  id: number;
  name: string;
  type?: string;
  industry?: string;
  geography?: string;
  estimatedDealSize?: string;
  dealSummary?: string;
  [key: string]: unknown;
}

interface DocTypeSelectorProps {
  deal: Deal;
  onGenerate: (docType: string) => void;
  error?: string | null;
}

const DOC_TYPES = [
  {
    id: "LOI",
    label: "Letter of Intent",
    icon: FileSignature,
    description: "Non-binding framework for deal terms, exclusivity, and timeline",
  },
  {
    id: "SPA",
    label: "Share Purchase Agreement",
    icon: Scale,
    description: "Binding agreement for share purchase, reps & warranties, indemnification",
  },
  {
    id: "Due Diligence Request List",
    label: "Due Diligence Request List",
    icon: ClipboardList,
    description: "Industry-tailored information requests for buyer diligence",
  },
];

export function DocTypeSelector({ deal, onGenerate, error }: DocTypeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold mb-2">
            <Sparkles className="h-4 w-4" />
            Structura AI — First Draft
          </div>
          <h1 className="text-3xl font-black text-slate-900">Generate Your First Draft</h1>
          <p className="text-slate-500 font-medium">
            Select the document type to generate with institutional-quality AI drafting
          </p>
        </div>

        {/* Deal Context */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Deal Context</p>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="font-bold text-slate-800 text-sm">{deal.name}</span>
            {deal.industry && (
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                {deal.industry}
              </span>
            )}
            {deal.geography && (
              <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                {deal.geography}
              </span>
            )}
            {deal.estimatedDealSize && (
              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                {deal.estimatedDealSize}
              </span>
            )}
            {deal.type && (
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                {deal.type}
              </span>
            )}
          </div>
          {deal.dealSummary && (
            <p className="text-sm text-slate-600 leading-relaxed">{deal.dealSummary}</p>
          )}
        </div>

        {/* Document Type Cards */}
        <div className="space-y-3">
          {DOC_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={cn(
                  "w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200",
                  isSelected
                    ? "border-blue-700 bg-blue-50 shadow-[0_0_0_4px_rgba(29,78,216,0.08)]"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                    isSelected ? "bg-blue-800" : "bg-slate-100"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isSelected ? "text-white" : "text-slate-500")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        "font-bold text-base",
                        isSelected ? "text-blue-900" : "text-slate-800"
                      )}
                    >
                      {type.label}
                    </h3>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        isSelected
                          ? "bg-blue-200 text-blue-900"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {type.id}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-blue-700" : "text-slate-500"
                    )}
                  >
                    {type.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-blue-800 bg-blue-800" : "border-slate-300 bg-white"
                  )}
                >
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-0.5">Generation failed</p>
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs mt-1 text-red-500">Make sure the API server is running: <code className="bg-red-100 px-1 rounded">node server.js</code></p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          disabled={!selected}
          onClick={() => selected && onGenerate(selected)}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3",
            selected
              ? "bg-blue-800 text-white shadow-lg shadow-blue-900/25 hover:bg-blue-900 hover:shadow-xl hover:shadow-blue-900/30 hover:scale-[1.01] active:scale-[0.99]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <Sparkles className={cn("h-5 w-5", selected ? "text-white" : "text-slate-400")} />
          Generate First Draft with Structura AI
        </button>
      </div>
    </div>
  );
}
