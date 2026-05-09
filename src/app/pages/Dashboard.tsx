import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Link } from "react-router";
import { ArrowRight, Clock, AlertCircle, CheckCircle2, Search, Filter, Eye, FileText, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";

const ongoingDeals = [
  { id: 1, name: "Acme Corp Acquisition (Project Apex)", type: "M&A", status: "In Negotiation", risk: "Medium", due: "2026-05-15", progress: 65, starred: true },
  { id: 2, name: "GlobalTech Vendor Agreement", type: "Commercial", status: "Under Review", risk: "Low", due: "2026-05-12", progress: 20, starred: false },
  { id: 3, name: "Nexus Series C Term Sheet", type: "Venture", status: "Redlining", risk: "High", due: "2026-05-10", progress: 85, starred: true },
  { id: 4, name: "Stark Ind. IP Licensing", type: "IP", status: "Pending Signature", risk: "Low", due: "2026-05-09", progress: 95, starred: false },
  { id: 5, name: "TechVision SaaS License", type: "Commercial", status: "In Negotiation", risk: "Low", due: "2026-05-18", progress: 45, starred: false },
  { id: 6, name: "Quantum Labs Joint Venture", type: "M&A", status: "Under Review", risk: "High", due: "2026-05-11", progress: 30, starred: true },
];

const clauseUsageData = [
  { name: "Standard Indemnification", uses: 840, ignored: 40 },
  { name: "Capped Liability (10%)", uses: 620, ignored: 120 },
  { name: "Aggressive Non-Compete", uses: 150, ignored: 380 },
  { name: "Standard Arbitration", uses: 790, ignored: 20 },
];

const riskData = [
  { name: "Low Risk", value: 45, color: "#10b981" },
  { name: "Medium Risk", value: 35, color: "#f59e0b" },
  { name: "High Risk", value: 20, color: "#ef4444" },
];

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [starredDeals, setStarredDeals] = useState<number[]>([1, 3, 6]);

  const toggleStar = (dealId: number) => {
    setStarredDeals(prev =>
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const filteredDeals = ongoingDeals.filter(deal => {
    const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "All" || deal.risk === filterRisk;
    const matchesType = filterType === "All" || deal.type === filterType;
    return matchesSearch && matchesRisk && matchesType;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date("2026-05-09");
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Negotiations" value="24" trend="+3 this week" />
        <StatCard title="Avg Cycle Time" value="18 days" trend="-2 days YoY" />
        <StatCard title="Critical Risks Spotted" value="7" trend="Needs review" alert />
        <StatCard title="Clauses Reused via AI" value="84%" trend="+12% this month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Summary List */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative z-10">
          {/* Header with Search and Filters */}
          <div className="p-6 border-b border-slate-100 bg-white/50 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Ongoing Deal Desk</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-500">{filteredDeals.length} deals</span>
                <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white/80 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Filter by Risk */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="pl-10 pr-8 py-2 rounded-lg border border-slate-200 bg-white/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Risk Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>

              {/* Filter by Type */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer pr-8"
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

          {/* Deals Grid/List */}
          <div className="flex-1 overflow-auto bg-white/30 p-4">
            <div className="space-y-3">
              {filteredDeals.map((deal) => {
                const daysUntil = getDaysUntilDue(deal.due);
                const isUrgent = daysUntil <= 1;
                const isStarred = starredDeals.includes(deal.id);

                return (
                  <div
                    key={deal.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden"
                  >
                    {/* Diamond accent in corner */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-green-400/10 rotate-45 pointer-events-none"></div>

                    <div className="flex items-start justify-between mb-3 relative">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <button
                            onClick={() => toggleStar(deal.id)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Star
                              className={cn(
                                "h-4 w-4 transition-all",
                                isStarred ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-yellow-400"
                              )}
                            />
                          </button>
                          <Link
                            to={`/deal/${deal.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {deal.name}
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md font-bold",
                            deal.type === "M&A" && "bg-blue-100 text-blue-700",
                            deal.type === "Commercial" && "bg-green-100 text-green-700",
                            deal.type === "Venture" && "bg-orange-100 text-orange-700",
                            deal.type === "IP" && "bg-yellow-100 text-yellow-700"
                          )}>
                            {deal.type}
                          </span>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md font-bold",
                            deal.risk === "Low" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            deal.risk === "Medium" && "bg-amber-50 text-amber-700 border border-amber-200",
                            deal.risk === "High" && "bg-red-50 text-red-700 border border-red-200"
                          )}>
                            {deal.risk} Risk
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/deal/${deal.id}`}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Open Deal"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Documents"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600">{deal.status}</span>
                        <span className="text-xs font-bold text-slate-700">{deal.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            deal.progress < 30 && "bg-gradient-to-r from-orange-400 to-yellow-400",
                            deal.progress >= 30 && deal.progress < 70 && "bg-gradient-to-r from-yellow-400 to-blue-400",
                            deal.progress >= 70 && "bg-gradient-to-r from-blue-400 to-green-400"
                          )}
                          style={{ width: `${deal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs font-medium">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        <span className={cn(
                          "font-bold",
                          isUrgent ? "text-red-600" : daysUntil <= 3 ? "text-orange-600" : "text-slate-600"
                        )}>
                          Due {new Date(deal.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={cn(
                          "ml-2 px-1.5 py-0.5 rounded font-bold",
                          isUrgent ? "bg-red-50 text-red-700" : daysUntil <= 3 ? "bg-orange-50 text-orange-700" : "text-slate-500"
                        )}>
                          {isUrgent ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDeals.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No deals match your filters</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clause Risk & Market Usage Dashboards */}
        <div className="space-y-8 relative z-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Portfolio Risk Profile</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, "Deals"]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-5 mt-4 text-xs font-medium text-slate-600">
              {riskData.map(risk => (
                <div key={risk.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: risk.color }}></div>
                  {risk.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-bold text-slate-800">Market Clause Usage</h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">Last 30 days</span>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed font-medium">
              Tracking automated precedent matching. Clauses marked as "unused" will be progressively ignored by the AI Co-pilot during suggestions.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clauseUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="uses" name="Adopted" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={12} />
                  <Bar dataKey="ignored" name="Ignored/Rejected" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, alert = false }: { title: string, value: string, trend: string, alert?: boolean }) {
  return (
    <div className={cn(
      "bg-white/70 backdrop-blur-xl rounded-2xl border p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md",
      alert ? "border-orange-200" : "border-slate-200"
    )}>
      {alert && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100/50 rounded-bl-full -z-0"></div>}
      <div className="relative z-10">
        <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
        <div className="mt-4 flex items-center text-xs font-bold">
          {alert ? (
            <span className="text-orange-700 flex items-center bg-orange-100/80 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {trend}
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center bg-emerald-100/80 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
