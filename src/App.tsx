import { useState, useEffect } from "react";
import type { User, Page } from "./types";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import StudyConnect from "./pages/StudyConnect";
import LostFound from "./pages/LostFound";
import Marketplace from "./pages/Marketplace";
import Events from "./pages/Events";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { api, setToken } from "./lib/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [checkingSession, setCheckingSession] = useState(true);

  // On load, if a JWT is already stored (from a previous login), fetch the
  // current user so a page refresh doesn't kick them back to the login screen.
  useEffect(() => {
    const stored = localStorage.getItem("campushub_token");
    if (!stored) { setCheckingSession(false); return; }
    api.auth
      .me()
      .then((u: any) => {
        setUser(u);
        setPage(u.role === "SECURITY_GUARD" ? "security-dashboard" : "dashboard");
      })
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setPage(u.role === "SECURITY_GUARD" ? "security-dashboard" : "dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setPage("dashboard");
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  const navigate = (p: Page) => setPage(p);

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (user.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        {/* Minimal security header */}
        <header className="bg-[#1e3a6e] text-white h-14 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
              <span className="text-[#1e3a6e] font-bold text-xs">CH</span>
            </div>
            <span className="font-semibold text-sm">Campus Hub</span>
            <span className="text-white/40 text-xs ml-1">· Admin Portal</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <span className="text-sm text-white/80">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition">Log out</button>
          </div>
        </header>
        <main className="p-6">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  if (user.role === "SECURITY_GUARD") {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        {/* Minimal security header */}
        <header className="bg-[#1e3a6e] text-white h-14 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
              <span className="text-[#1e3a6e] font-bold text-xs">CH</span>
            </div>
            <span className="font-semibold text-sm">Campus Hub</span>
            <span className="text-white/40 text-xs ml-1">· Security Portal</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <span className="text-sm text-white/80">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-white/60 hover:text-white transition">Log out</button>
          </div>
        </header>
        <main className="p-6">
          <SecurityDashboard />
        </main>
      </div>
    );
  }

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard user={user} onNavigate={navigate} />;

    if (page === "study-connect" || page === "study-group-detail" || page === "create-study-group" || page === "my-study-groups") return <StudyConnect subPage={page} onNavigate={navigate} />;

    if (page === "lost-found" || page === "report-lost" || page === "my-reports")
      return <LostFound subPage={page} onNavigate={navigate} userName={user.name} />;

    if (page === "marketplace" || page === "textbook-detail" || page === "sell-textbook" || page === "my-listings")
      return <Marketplace subPage={page} onNavigate={navigate} />;

    if (page === "events" || page === "event-detail" || page === "my-events" || page === "create-event")
      return <Events subPage={page} onNavigate={navigate} />;

    return <Dashboard user={user} onNavigate={navigate} />;
  };

  return (
    <Layout user={user} currentPage={page} onNavigate={navigate} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}
