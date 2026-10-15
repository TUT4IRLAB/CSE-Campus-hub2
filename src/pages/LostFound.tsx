import { useState, useEffect } from "react";
import type { Page, LostItem } from "../types";
import { api } from "../lib/api";
import { Card, Badge, Button, StatusBadge, PageHeader, EmptyState, Input, Textarea, Select, Toast } from "../components/ui";

interface Props {
  subPage: Page;
  onNavigate: (page: Page) => void;
  userName: string;
}

export default function LostFound({ subPage, onNavigate }: Props) {
  const [myReports, setMyReports] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.lostItems
      .mine()
      .then((data: any) => setMyReports(data))
      .catch(() => showToast("Failed to load your reports.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleReported = (item: LostItem) => {
    setMyReports(items => [item, ...items]);
  };

  if (subPage === "report-lost") {
    return <ReportLostForm onNavigate={onNavigate} showToast={showToast} toast={toast} onReported={handleReported} />;
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto text-center py-16 text-slate-400 text-sm">Loading…</div>;
  }

  if (subPage === "my-reports") {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="My Lost Item Reports"
          subtitle="Track the status of your reported items"
          actions={<Button size="sm" onClick={() => onNavigate("report-lost")}>+ Report Lost Item</Button>}
        />
        {myReports.length === 0 ? (
          <EmptyState icon="◎" title="No lost item reports" description="You haven't reported any lost items." action={<Button onClick={() => onNavigate("report-lost")}>Report a Lost Item</Button>} />
        ) : (
          <div className="space-y-3">
            {myReports.map(item => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Main Lost & Found page
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Lost & Found"
        subtitle="Report lost items and check on your reports"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("my-reports")}>My Reports</Button>
            <Button size="sm" onClick={() => onNavigate("report-lost")}>+ Report Lost Item</Button>
          </div>
        }
      />

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "My Reports", value: myReports.length, color: "text-slate-900" },
          { label: "Pending", value: myReports.filter(i => i.status === "Lost").length, color: "text-red-600" },
          { label: "Found/Returned", value: myReports.filter(i => i.status !== "Lost").length, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Your Reports</p>
        {myReports.length === 0 ? (
          <EmptyState icon="◎" title="You haven't reported any lost items." action={<Button onClick={() => onNavigate("report-lost")}>Report a Lost Item</Button>} />
        ) : (
          <div className="space-y-3">
            {myReports.map(item => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ItemRow({ item }: { item: LostItem }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-slate-400">#{item.id.slice(0, 8)}</span>
            <Badge variant="neutral">{item.category}</Badge>
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">{item.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
            <span>📍 {item.location}</span>
            <span>📅 Lost: {item.dateLost}</span>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      {item.status === "Found" && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-start gap-2">
          <span>ℹ</span>
          <span>Your item has been found. Please visit the Security Office with your student card to collect it.</span>
        </div>
      )}
      {item.status === "Returned" && (
        <div className="mt-3 p-2.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 flex items-start gap-2">
          <span>✓</span>
          <span>This item has been returned to you. Report closed.</span>
        </div>
      )}
    </Card>
  );
}

function ReportLostForm({ onNavigate, showToast, toast, onReported }: {
  onNavigate: (p: Page) => void;
  showToast: (m: string, t?: any) => void;
  toast: any;
  onReported: (item: LostItem) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", location: "", dateLost: "", category: "Personal Item" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created: LostItem = await api.lostItems.report(form);
      onReported(created);
      setSubmitted(true);
      showToast("Lost item report submitted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit report.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => onNavigate("lost-found")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
        ← Back to Lost & Found
      </button>
      <PageHeader title="Report Lost Item" subtitle="Provide details so security can identify your item" />

      {submitted ? (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h3 className="font-semibold text-slate-900 mb-1">Report Submitted</h3>
          <p className="text-sm text-slate-500 mb-4">Your lost item report has been submitted. Security will notify you if your item is found.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => onNavigate("my-reports")}>View My Reports</Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", description: "", location: "", dateLost: "", category: "Personal Item" }); }}>Report Another</Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Item name" placeholder="e.g. Black leather wallet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Textarea label="Description" placeholder="Describe the item in detail — colour, brand, markings, contents..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {["Personal Item", "Electronics", "Bag", "Keys", "ID/Cards", "Clothing", "Other"].map(c => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Last known location" placeholder="e.g. Main Cafeteria, 2nd floor" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            <Input label="Date lost" type="date" value={form.dateLost} onChange={e => setForm(f => ({ ...f, dateLost: e.target.value }))} required />
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Submitting…" : "Submit Report"}</Button>
              <Button variant="outline" type="button" onClick={() => onNavigate("lost-found")}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => {}} />}
    </div>
  );
}
