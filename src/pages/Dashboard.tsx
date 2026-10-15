import { useState, useEffect } from "react";
import type { User, Page, StudyGroup, Textbook, CampusEvent, LostItem } from "../types";
import { api } from "../lib/api";
import { Card, Badge, SectionLabel } from "../components/ui";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ user, onNavigate }: Props) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [books, setBooks] = useState<Textbook[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myReports, setMyReports] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.studyGroups.list(),
      api.textbooks.list(),
      api.events.list(),
      api.lostItems.mine(),
    ])
      .then(([g, b, e, r]: any[]) => {
        setGroups(g);
        setBooks(b);
        setEvents(e);
        setMyReports(r);
      })
      .finally(() => setLoading(false));
  }, []);

  const myGroups = groups.filter(g => g.joined);
  const upcomingEvents = events.slice(0, 2);
  const recentBooks = books.filter(b => b.available).slice(0, 3);
  const recentReports = myReports.slice(0, 2);

  const stats = [
    { label: "Study Groups", value: `${myGroups.length} active`, icon: "⊹", color: "text-blue-600 bg-blue-50", page: "study-connect" as Page },
    { label: "Lost & Found", value: `${myReports.length} reported`, icon: "◎", color: "text-amber-600 bg-amber-50", page: "lost-found" as Page },
    { label: "Marketplace", value: `${books.filter(b => b.available).length} textbooks`, icon: "◈", color: "text-violet-600 bg-violet-50", page: "marketplace" as Page },
    { label: "Events", value: `${events.length} upcoming`, icon: "◷", color: "text-emerald-600 bg-emerald-50", page: "events" as Page },
  ];

  const quickActions = [
    { label: "Find Study Group", icon: "🔍", page: "study-connect" as Page },
    { label: "Create Study Group", icon: "➕", page: "create-study-group" as Page },
    { label: "Browse Textbooks", icon: "📚", page: "marketplace" as Page },
    { label: "View Events", icon: "📅", page: "events" as Page },
    { label: "Report Lost Item", icon: "⚠️", page: "report-lost" as Page },
  ];

  if (loading) {
    return <div className="max-w-6xl mx-auto text-center py-16 text-slate-400 text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-slate-900">
          Hello, {user.name.split(" ")[0]}.
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <Card
            key={stat.label}
            onClick={() => onNavigate(stat.page)}
            className="p-4"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <Card className="p-5">
            <SectionLabel>Quick Actions</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.page)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </Card>

          {/* My Study Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>My Study Groups</SectionLabel>
              <button onClick={() => onNavigate("study-connect")} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
            </div>
            {myGroups.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-slate-500 text-sm">No active study groups. <button onClick={() => onNavigate("study-connect")} className="text-blue-600 hover:underline">Find one</button></p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myGroups.map(g => (
                  <Card key={g.id} className="p-4" onClick={() => onNavigate("study-connect")}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="info">{g.moduleCode}</Badge>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{g.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{g.date} · {g.time} · {g.location}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {g.topics.map(t => (
                            <span key={t} className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{g.members}/{g.maxMembers}</p>
                        <p className="text-[10px] text-slate-400">members</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Textbooks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Recently Listed Textbooks</SectionLabel>
              <button onClick={() => onNavigate("marketplace")} className="text-xs text-blue-600 hover:underline font-medium">Browse all</button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {recentBooks.map(book => (
                <Card key={book.id} className="overflow-hidden" onClick={() => onNavigate("marketplace")}>
                  <img src={book.image} alt={book.title} className="w-full h-28 object-cover bg-slate-100" />
                  <div className="p-3">
                    <p className="text-xs text-slate-500 font-mono">{book.moduleCode}</p>
                    <p className="text-sm font-medium text-slate-900 line-clamp-2 mt-0.5 leading-snug">{book.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-[#1e3a6e]">R{book.price}</span>
                      <Badge variant={book.condition === "Excellent" ? "success" : book.condition === "Good" ? "info" : "neutral"}>
                        {book.condition}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile card */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1e3a6e]/10 flex items-center justify-center shrink-0">
                <span className="text-[#1e3a6e] font-bold text-base">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{user.studentNumber}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Email</span>
                <span className="font-medium text-slate-800 truncate max-w-[55%]">{user.email}</span>
              </div>
            </div>
          </Card>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Upcoming Events</SectionLabel>
              <button onClick={() => onNavigate("events")} className="text-xs text-blue-600 hover:underline font-medium">All events</button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <Card key={ev.id} className="p-3" onClick={() => onNavigate("events")}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1e3a6e]/8 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#1e3a6e] leading-tight">{ev.date.split(" ")[1]}</span>
                      <span className="text-[10px] text-slate-500">{ev.date.split(" ")[2]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">{ev.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ev.time} · {ev.location.split(",")[0]}</p>
                      <Badge variant={ev.registered ? "success" : "neutral"} >{ev.registered ? "Registered" : ev.category}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Lost & Found status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>My Reports</SectionLabel>
              <button onClick={() => onNavigate("my-reports")} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
            </div>
            {recentReports.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-xs text-slate-500">No lost item reports.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentReports.map(item => (
                  <Card key={item.id} className="p-3 flex items-center justify-between" onClick={() => onNavigate("lost-found")}>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">Lost {item.dateLost}</p>
                    </div>
                    <Badge variant={item.status === "Lost" ? "error" : item.status === "Found" ? "warning" : "success"}>
                      {item.status}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
