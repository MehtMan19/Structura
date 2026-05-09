import { useEffect, useState } from "react";
import { Check, Sparkles, AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";

const STEPS = [
  "Scanning precedent library...",
  "Identifying relevant historical deals...",
  "Comparing clause structures...",
  "Synthesizing optimal legal language...",
  "Finalizing institutional-quality draft...",
];

const STEP_INTERVAL = 3500;
const TIMEOUT_AFTER_STEPS = 10000; // 10s after all steps finish

interface GeneratingScreenProps {
  docType: string;
  dealName: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function GeneratingScreen({ docType, dealName, onRetry, onCancel }: GeneratingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Step progression
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, STEP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Timeout: once all steps finish, start a 10s countdown
  useEffect(() => {
    if (currentStep < STEPS.length - 1) return;

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, TIMEOUT_AFTER_STEPS);

    return () => clearTimeout(timeout);
  }, [currentStep]);

  const progress = timedOut
    ? 100
    : Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Card container for a more professional look */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-900/20 mb-6">
              <Sparkles className={cn("h-4 w-4", !timedOut && "animate-pulse")} />
              {timedOut ? "Generation taking too long" : "Structura AI is drafting your document"}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {timedOut ? "Request Timed Out" : `Generating ${docType}`}
            </h2>
            <p className="text-slate-500 font-medium text-sm truncate">{dealName}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Progress</span>
              <span className={timedOut ? "text-red-500" : "text-blue-700"}>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-1000 ease-in-out",
                  timedOut ? "bg-red-400" : "bg-blue-700"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const isDone = i < currentStep || (i === currentStep && timedOut);
              const isCurrent = i === currentStep && !timedOut;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 py-1 transition-all duration-700",
                    isDone || isCurrent ? "opacity-100" : "opacity-30"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
                      isDone
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-blue-700 animate-pulse"
                        : "bg-slate-200"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isDone
                        ? "text-green-700"
                        : isCurrent
                        ? "text-blue-800 font-semibold"
                        : "text-slate-400"
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeout actions */}
          {timedOut ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-800 mb-0.5">Generation timed out</p>
                  <p className="text-xs text-red-600">
                    The AI model did not respond in time. This can happen with complex documents or heavy server load.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-800 text-white font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry Generation
                </button>
                <button
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 font-medium">
              This may take 20–40 seconds for complex documents
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
