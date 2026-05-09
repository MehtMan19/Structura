import { useState } from "react";
import { Link } from "react-router";
import { Search, Eye, FileText, Star, Clock, AlertCircle, Filter } from "lucide-react";
import { cn } from "../lib/utils";

const SEEDED_DEALS = [
  { id: 1, name: "Shopify Acquisition (Project Shop)", type: "M&A", status: "In Negotiation", due: "2026-06-15", progress: 40, starred: true },
];

function loadAllDeals() {
  try {
    const stored = JSON.parse(localStorage.getItem("structura_deals") ?? "[]");
    return [...stored, ...SEEDED_DEALS];
  } catch {
    return SEEDED_DEALS;
  }
}

export function ActiveDeals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [allDeals] = useState(loadAllDeals);
  const [starredDeals, setStarredDeals] = useState<number[]>([1]);
  const [viewMode, setViewMode] = useState<"all" | "starred">("all");

  const toggleStar = (dealId: number) => {
    setStarredDeals(prev =>
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const filteredDeals = allDeals.filter(deal => {
    const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || deal.type === filterType;
    const matchesStarred = viewMode === "all" || starredDeals.includes(deal.id);
    return matchesSearch && matchesType && matchesStarred;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date("2026-05-09");
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Active Deals</h1>
          <p className="text-slate-600 font-medium">Manage and track all ongoing negotiations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            All Deals ({allDeals.length})
          </button>
          <button
            onClick={() => setViewMode("starred")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-1.5",
              viewMode === "starred"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <Star className={cn("h-4 w-4", viewMode === "starred" ? "fill-yellow-300" : "")} />
            <span>Starred ({starredDeals.length})</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="M&A">M&A</option>
              <option value="Commercial">Commercial</option>
              <option value="Venture">Venture</option>
              <option value="IP">IP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredDeals.map((deal) => {
          const daysUntil = getDaysUntilDue(deal.due);
          const isUrgent = daysUntil <= 1;
          const isStarred = starredDeals.includes(deal.id);

          return (
            <div
              key={deal.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-green-400/10 rotate-45 pointer-events-none" />

              <div className="flex items-start justify-between mb-4 relative">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => toggleStar(deal.id)}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Star className={cn(
                        "h-4 w-4 transition-all",
                        isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-yellow-400"
                      )} />
                    </button>
                    <Link
                      to={`/deal/${deal.id}`}
                      className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {deal.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-md font-bold",
                      deal.type === "M&A" && "bg-blue-100 text-blue-700",
                      deal.type === "Commercial" && "bg-green-100 text-green-700",
                      deal.type === "Venture" && "bg-orange-100 text-orange-700",
                      deal.type === "IP" && "bg-yellow-100 text-yellow-700"
                    )}>
                      {deal.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/deal/${deal.id}`}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{deal.status}</span>
                  <span className="text-xs font-black text-slate-700">{deal.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${deal.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center pt-3 border-t border-slate-100">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <span className={cn(
                  "text-xs font-bold",
                  isUrgent ? "text-red-600" : daysUntil <= 3 ? "text-orange-600" : "text-slate-600"
                )}>
                  Due {new Date(deal.due).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded font-bold",
                  isUrgent ? "bg-red-50 text-red-700" : daysUntil <= 3 ? "bg-orange-50 text-orange-700" : "text-slate-500"
                )}>
                  {isUrgent ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                </span>
              </div>
            </div>
          );
        })}

        {filteredDeals.length === 0 && (
          <div className="col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="font-bold text-slate-700 text-lg mb-2">No deals found</p>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
