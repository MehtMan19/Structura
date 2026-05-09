import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  FileText,
  Upload,
  X,
  FileSignature,
  Scale,
  ClipboardList,
  BookOpen,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type PrecedentCategory = "LOI" | "SPA" | "Due Diligence Request List";

interface PrecedentFile {
  id: string;
  name: string;
  size: number;
  category: PrecedentCategory;
  addedAt: string;
  storagePath: string;
}

const CATEGORIES: Array<{
  id: PrecedentCategory;
  label: string;
  slug: string;
  icon: typeof FileSignature;
  description: string;
}> = [
  {
    id: "LOI",
    label: "Letter of Intent",
    slug: "loi",
    icon: FileSignature,
    description: "Historical LOI precedents — term sheets, framework agreements",
  },
  {
    id: "SPA",
    label: "Share Purchase Agreement",
    slug: "spa",
    icon: Scale,
    description: "Executed SPAs — reps & warranties, indemnification structures",
  },
  {
    id: "Due Diligence Request List",
    label: "Due Diligence Request List",
    slug: "due-diligence",
    icon: ClipboardList,
    description: "Prior DD checklists — industry-specific information requests",
  },
];

const BUCKET = "precedents";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = /\.(pdf|doc|docx)$/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Precedents() {
  const [precedents, setPrecedents] = useState<PrecedentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<PrecedentCategory>("LOI");
  const [dragOverCategory, setDragOverCategory] = useState<PrecedentCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch all files from Supabase Storage ──
  const fetchPrecedents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allFiles: PrecedentFile[] = [];

      for (const cat of CATEGORIES) {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .list(cat.slug, { sortBy: { column: "created_at", order: "desc" } });

        if (error) throw error;

        const files: PrecedentFile[] = (data ?? [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            id: f.id ?? f.name,
            name: f.name.replace(/^\d+-/, ""), // strip leading timestamp prefix
            size: f.metadata?.size ?? 0,
            category: cat.id,
            addedAt: f.created_at ?? new Date().toISOString(),
            storagePath: `${cat.slug}/${f.name}`,
          }));

        allFiles.push(...files);
      }

      setPrecedents(allFiles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load precedents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrecedents();
  }, [fetchPrecedents]);

  // ── Upload files to Supabase Storage ──
  const addFiles = useCallback(
    async (files: FileList | File[], category: PrecedentCategory) => {
      const valid = Array.from(files).filter(
        (f) => ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXTENSIONS.test(f.name)
      );
      if (valid.length === 0) return;

      const slug = CATEGORIES.find((c) => c.id === category)!.slug;
      setUploading(true);
      setError(null);

      try {
        for (const file of valid) {
          const safeName = `${Date.now()}-${file.name}`;
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(`${slug}/${safeName}`, file, { upsert: false });

          if (error) throw error;
        }
        await fetchPrecedents();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [fetchPrecedents]
  );

  // ── Delete a file from Supabase Storage ──
  const removePrecedent = useCallback(
    async (storagePath: string) => {
      setError(null);
      const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (error) {
        setError(error.message);
        return;
      }
      setPrecedents((prev) => prev.filter((p) => p.storagePath !== storagePath));
    },
    []
  );

  // ── Download a file ──
  const downloadFile = useCallback(async (storagePath: string, name: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, category: PrecedentCategory) => {
      e.preventDefault();
      setDragOverCategory(null);
      addFiles(e.dataTransfer.files, category);
    },
    [addFiles]
  );

  const handleUploadClick = (category: PrecedentCategory) => {
    setUploadCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files, uploadCategory);
      e.target.value = "";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Precedents Database</h1>
          <p className="text-slate-500 font-medium">
            Upload historical deal documents to power Structura AI's drafting intelligence
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm",
            showUpload
              ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
              : "bg-blue-800 text-white hover:bg-blue-900"
          )}
        >
          {showUpload ? (
            <><X className="h-4 w-4" /> Close</>
          ) : (
            <><Plus className="h-4 w-4" /> Add Precedent</>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-5 w-5 text-blue-700" />
            <h2 className="font-bold text-slate-800 text-lg">Upload Precedent Documents</h2>
            {uploading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-1" />}
          </div>
          <p className="text-sm text-slate-500">
            Drag & drop or click to upload PDF or Word documents into any category below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isDragOver = dragOverCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onDrop={(e) => handleDrop(e, cat.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCategory(cat.id); }}
                  onDragLeave={() => setDragOverCategory(null)}
                  onClick={() => !uploading && handleUploadClick(cat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all p-6 text-center min-h-[160px]",
                    uploading && "opacity-50 cursor-not-allowed",
                    isDragOver
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30"
                  )}
                >
                  <Icon className={cn("h-8 w-8 mb-3", isDragOver ? "text-blue-600" : "text-slate-400")} />
                  <p className="font-bold text-sm text-slate-700 mb-1">{cat.label}</p>
                  <p className="text-xs text-slate-400">{cat.description}</p>
                  <p className="text-xs text-blue-600 font-medium mt-3">
                    {uploading ? "Uploading…" : "Click or drop files here"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories with files */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm font-medium">Loading precedents…</span>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const catFiles = precedents.filter((p) => p.category === cat.id);

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{cat.label}</h3>
                    <p className="text-xs text-slate-400">
                      {catFiles.length} precedent{catFiles.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUploadClick(cat.id)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {catFiles.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {catFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(file.size)} —{" "}
                            {new Date(file.addedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => downloadFile(file.storagePath, file.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removePrecedent(file.storagePath)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove precedent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <BookOpen className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No precedents uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload PDF or Word documents to build your precedent library
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
