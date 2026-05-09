import { Link, Outlet, useLocation } from "react-router";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Settings,
  Bell,
  FolderPlus
} from "lucide-react";

export function Layout() {
  const location = useLocation();

  const workspaceItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: FileText, label: "Active Deals", path: "/active-deals" },
    { icon: BookOpen, label: "Precedents", path: "/precedents" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 border-r border-slate-800 relative overflow-hidden">
        {/* Colorful gradient accent at top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-yellow-400"></div>
        
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          {/* Diamond Logo */}
          <div className="relative w-8 h-8 mr-4 transform rotate-45 flex-shrink-0">
            <div className="absolute top-0 left-0 w-4 h-4 bg-yellow-400 rounded-sm"></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-orange-500 rounded-sm"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-sm"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-white tracking-wide">Structura</span>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          <Link
            to="/new-project"
            className={cn(
              "flex items-center w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-4",
              location.pathname === "/new-project"
                ? "bg-white/10 text-white shadow-[inset_4px_0_0_0_#3b82f6]"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <FolderPlus className={`h-5 w-5 mr-3 ${location.pathname === "/new-project" ? "text-blue-400" : "text-slate-400"}`} />
            New Project
          </Link>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Workspace</div>
          {workspaceItems.map((item) => {
            const isActive = location.pathname === item.path ||
                             (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_4px_0_0_0_#3b82f6]"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <Link
            to="/settings"
            className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
          >
            <Settings className="h-5 w-5 mr-3 text-slate-400" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Subtle background diamond patterns */}
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] border-[1px] border-slate-200/50 rounded-3xl transform rotate-45 pointer-events-none z-0"></div>
        <div className="absolute top-[20%] right-[10%] w-[20vw] h-[20vw] border-[1px] border-blue-100/30 rounded-3xl transform rotate-45 pointer-events-none z-0"></div>

        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {location.pathname === "/" ? "Dashboard" :
               location.pathname === "/active-deals" ? "Active Deals" :
               location.pathname.startsWith("/deal") ? "Negotiation Workspace" :
               "Legal Intelligence"}
            </h1>
          </div>
          <div className="flex items-center space-x-5">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-green-400 p-[2px]">
              <div className="h-full w-full bg-white rounded-full flex items-center justify-center text-slate-800 font-bold text-sm">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
