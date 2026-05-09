import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { DealWorkspace } from "./pages/DealWorkspace";
import { ActiveDeals } from "./pages/ActiveDeals";
import { NewProject } from "./pages/NewProject";
import { Precedents } from "./pages/Precedents";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "new-project", Component: NewProject },
      { path: "active-deals", Component: ActiveDeals },
      { path: "deal/:id", Component: DealWorkspace },
      { path: "precedents", Component: Precedents },
      { 
        path: "market", 
        Component: () => (
          <div className="p-12 text-center text-slate-500">
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Market Clauses</h2>
            <p>Identify missing clauses and ensure mention of client needs. Powered by historical deals data.</p>
          </div>
        ) 
      }
    ],
  },
]);
