import { type ReactNode, useState } from "react";
import type { User, Page } from "../types";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "study-connect", label: "StudyConnect", icon: "⊹" },
  { id: "lost-found", label: "Lost & Found", icon: "◎" },
  { id: "marketplace", label: "Marketplace", icon: "◈" },
  { id: "events", label: "Events", icon: "◷" },
] as const;

interface LayoutProps {
  children: ReactNode;
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const PAGE_TO_NAV: Record<string, string> = {
  "study-connect": "study-connect", "study-group-detail": "study-connect", "create-study-group": "study-connect", "my-study-groups": "study-connect",
  "lost-found": "lost-found", "report-lost": "lost-found", "my-reports": "lost-found",
  marketplace: "marketplace", "textbook-detail": "marketplace", "sell-textbook": "marketplace", "my-listings": "marketplace",
  events: "events", "event-detail": "events", "my-events": "events", "create-event": "events",
};

export default function Layout({ children, user, currentPage, onNavigate, onLogout }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePage = PAGE_TO_NAV[currentPage] ?? "dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fc]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-[#1e3a6e] text-white shrink-0
        transform transition-transform duration-200
        lg:static lg:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <span className="text-[#1e3a6e] font-bold text-sm">CH</span>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Campus Hub</p>
            <p className="text-white/50 text-[10px]">Your campus, connected.</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold px-3 mb-2">Main</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id as Page); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 text-left ${
                activePage === item.id
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-base w-5 text-center opacity-80">{item.icon}</span>
              {item.label}
              {activePage === item.id && <span className="ml-auto w-1 h-1 rounded-full bg-white/70" />}
            </button>
          ))}

          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold px-3 mb-2 mt-6">Account</p>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <span className="text-base w-5 text-center opacity-80">→</span> Log out
          </button>
        </nav>

        {/* User snippet */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 font-mono truncate">{user.studentNumber ?? "Security Guard"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 bg-white border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-4">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 p-1"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* User name + initials */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-[#1e3a6e]/10 flex items-center justify-center">
                <span className="text-[#1e3a6e] text-xs font-semibold">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden md:block">{user.name.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
