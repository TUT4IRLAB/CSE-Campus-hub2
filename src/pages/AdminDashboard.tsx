import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Card, Badge, Button, StatusBadge, Modal, Toast } from "../components/ui";

type TabKey = "users" | "study-groups" | "lost-items" | "textbooks" | "events";

interface Person { id: string; name: string; email: string; phone: string | null }
interface Overview {
  users: any[];
  studyGroups: any[];
  lostItems: any[];
  textbooks: any[];
  events: any[];
}

const TABS: { key: TabKey; label: string; field: keyof Overview }[] = [
  { key: "users", label: "Users", field: "users" },
  { key: "study-groups", label: "Study Groups", field: "studyGroups" },
  { key: "lost-items", label: "Lost & Found", field: "lostItems" },
  { key: "textbooks", label: "Textbooks", field: "textbooks" },
  { key: "events", label: "Events", field: "events" },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function PostedBy({ p }: { p: Person | null }) {
  if (!p) return <span className="text-xs text-slate-400">Official (not user-posted)</span>;
  return (
    <div>
      <p className="text-sm font-medium text-slate-900">{p.name}</p>
      <p className="text-[11px] text-slate-500">{p.email}</p>
      <p className="text-[11px] text-slate-500">{p.phone ?? "No phone"}</p>
    </div>
  );
}

function Primary({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-slate-900">{title}</p>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

interface Column { header: string; cell: (row: any) => React.ReactNode }

function columnsFor(tab: TabKey): Column[] {
  const posted: Column = { header: "Posted", cell: r => <span className="text-xs text-slate-600">{fmtDate(r.createdAt)}</span> };
  switch (tab) {
    case "users":
      return [
        { header: "User", cell: r => <Primary title={r.name} sub={r.email} /> },
        { header: "Phone", cell: r => <span className="text-xs text-slate-600">{r.phone ?? "—"}</span> },
        { header: "Role", cell: r => <Badge variant={r.role === "ADMIN" ? "error" : r.role === "SECURITY_GUARD" ? "warning" : "info"}>{r.role === "SECURITY_GUARD" ? "SECURITY" : r.role}</Badge> },
        { header: "Student no.", cell: r => <span className="text-xs font-mono text-slate-600">{r.studentNumber ?? "—"}</span> },
        {
          header: "Posts",
          cell: r => (
            <span className="text-xs text-slate-600">
              {r.counts.studyGroups} groups · {r.counts.lostItems} reports · {r.counts.textbooks} listings · {r.counts.events} events
            </span>
          ),
        },
        { header: "Joined", cell: r => <span className="text-xs text-slate-600">{fmtDate(r.createdAt)}</span> },
      ];
    case "study-groups":
      return [
        { header: "Group", cell: r => <Primary title={r.name} sub={<Badge variant="info">{r.moduleCode}</Badge>} /> },
        { header: "When", cell: r => <span className="text-xs text-slate-600">{r.date}<br />{r.time}</span> },
        { header: "Location", cell: r => <span className="text-xs text-slate-600">{r.location}</span> },
        { header: "Members", cell: r => <span className="text-xs text-slate-600">{r.members}/{r.maxMembers}</span> },
        { header: "Posted by", cell: r => <PostedBy p={r.postedBy} /> },
        posted,
      ];
    case "lost-items":
      return [
        { header: "Item", cell: r => <Primary title={r.name} sub={<Badge variant="neutral">{r.category}</Badge>} /> },
        { header: "Location", cell: r => <span className="text-xs text-slate-600">{r.location}</span> },
        { header: "Date lost", cell: r => <span className="text-xs font-mono text-slate-600">{r.dateLost}</span> },
        { header: "Status", cell: r => <StatusBadge status={r.status} /> },
        { header: "Reported by", cell: r => <PostedBy p={r.postedBy} /> },
        { header: "Handled by", cell: r => <span className="text-xs text-slate-600">{r.handledBy ?? "—"}</span> },
        posted,
      ];
    case "textbooks":
      return [
        { header: "Textbook", cell: r => <Primary title={r.title} sub={r.author} /> },
        { header: "Module", cell: r => <span className="text-xs font-mono text-slate-600">{r.moduleCode}</span> },
        { header: "Price", cell: r => <span className="text-sm font-semibold text-slate-900">R{r.price}</span> },
        { header: "Condition", cell: r => <Badge variant="neutral">{r.condition}</Badge> },
        { header: "Status", cell: r => <StatusBadge status={r.available ? "Available" : "Sold"} /> },
        { header: "Seller", cell: r => <PostedBy p={r.postedBy} /> },
        posted,
      ];
    case "events":
      return [
        { header: "Event", cell: r => <Primary title={r.title} sub={<Badge variant="neutral">{r.category}</Badge>} /> },
        { header: "When", cell: r => <span className="text-xs text-slate-600">{r.date}<br />{r.time}</span> },
        { header: "Location", cell: r => <span className="text-xs text-slate-600">{r.location}</span> },
        { header: "Registered", cell: r => <span className="text-xs text-slate-600">{r.attendees}/{r.capacity}</span> },
        { header: "Created by", cell: r => <PostedBy p={r.postedBy} /> },
        posted,
      ];
  }
}

const titleOf = (tab: TabKey, row: any) => (tab === "textbooks" || tab === "events" ? row.title : row.name);
const singular: Record<TabKey, string> = {
  users: "user",
  "study-groups": "study group",
  "lost-items": "lost item report",
  textbooks: "textbook listing",
  events: "event",
};

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("study-groups");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ tab: TabKey; row: any } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () =>
    api.admin
      .overview()
      .then((d: any) => { setData(d); setError(""); })
      .catch((e: Error) => setError(e.message || "Failed to load data."));

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.admin.remove(deleteTarget.tab, deleteTarget.row.id);
      setDeleteTarget(null);
      showToast(`Deleted ${singular[deleteTarget.tab]}.`, "info");
      await load(); // refresh so the per-user post counts stay accurate
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (error && !data) {
    return <div className="max-w-6xl mx-auto text-center py-16 text-red-600 text-sm">{error}</div>;
  }
  if (!data) {
    return <div className="max-w-6xl mx-auto text-center py-16 text-slate-400 text-sm">Loading…</div>;
  }

  const current = TABS.find(t => t.key === tab)!;
  const rows = data[current.field].filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const columns = columnsFor(tab);
  const canDelete = tab !== "users";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">See who posted what, and remove anything that shouldn't be there.</p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {TABS.map(t => (
          <Card key={t.key} className={`p-4 ${tab === t.key ? "ring-2 ring-[#1e3a6e]" : ""}`} onClick={() => { setTab(t.key); setSearch(""); }}>
            <p className="text-2xl font-bold text-slate-900">{data[t.field].length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs + search */}
      <Card className="p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-50 rounded-lg border border-slate-200 p-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(""); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${tab === t.key ? "bg-white shadow-sm text-[#1e3a6e]" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, poster name or email…"
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {columns.map(c => (
                  <th key={c.header} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.header}</th>
                ))}
                {canDelete && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors align-top">
                  {columns.map(c => (
                    <td key={c.header} className="px-4 py-3">{c.cell(row)}</td>
                  ))}
                  {canDelete && (
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteTarget({ tab, row })} className="text-xs text-red-600 hover:underline font-medium">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-500 text-sm">
                    {search ? "Nothing matches your search." : `No ${current.label.toLowerCase()} yet.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleteTarget && (
        <Modal
          title={`Delete ${singular[deleteTarget.tab]}`}
          onClose={() => setDeleteTarget(null)}
          actions={<>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Button>
          </>}
        >
          <p className="text-slate-600 text-sm">
            Permanently delete <strong>{titleOf(deleteTarget.tab, deleteTarget.row)}</strong>
            {deleteTarget.row.postedBy ? <> posted by <strong>{deleteTarget.row.postedBy.name}</strong></> : null}? This cannot be undone.
          </p>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
