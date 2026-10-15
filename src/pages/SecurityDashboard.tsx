import { useState, useEffect } from "react";
import type { LostItem } from "../types";
import { api } from "../lib/api";
import { Card, Badge, Button, StatusBadge, Input, Toast, Modal } from "../components/ui";

export default function SecurityDashboard() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [returnModal, setReturnModal] = useState<LostItem | null>(null);
  const [foundModal, setFoundModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<LostItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.lostItems
      .list()
      .then((data: any) => setItems(data))
      .catch(() => showToast("Failed to load items.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.reportedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    lost: items.filter(i => i.status === "Lost").length,
    found: items.filter(i => i.status === "Found").length,
    returned: items.filter(i => i.status === "Returned").length,
  };

  const updateStatus = async (id: string, status: LostItem["status"]) => {
    try {
      const updated: LostItem = await api.lostItems.updateStatus(id, status.toUpperCase() as "LOST" | "FOUND" | "RETURNED");
      setItems(its => its.map(i => i.id === id ? updated : i));
      setReturnModal(null);
      showToast(`Item marked as ${status}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update item.", "error");
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await api.lostItems.remove(id);
      setItems(its => its.filter(i => i.id !== id));
      setDeleteModal(null);
      showToast("Record deleted.", "info");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete record.", "error");
    }
  };

  // Security guards registering a found item: create the report, then
  // immediately flip its status to Found (students' reports always start
  // as Lost — see backend/src/controllers/lostItems.controller.ts).
  const registerFoundItem = async (form: { name: string; description: string; location: string; dateFound: string }) => {
    const created: LostItem = await api.lostItems.report({
      name: form.name,
      description: form.description || "Registered directly by security.",
      location: form.location,
      dateLost: form.dateFound,
      category: "Found Item",
    });
    const updated: LostItem = await api.lostItems.updateStatus(created.id, "FOUND");
    setItems(its => [updated, ...its]);
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto text-center py-16 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">Security Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Lost & Found Item Management</p>
        </div>
        <Button size="sm" onClick={() => setFoundModal(true)}>+ Register Found Item</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items", value: stats.total, color: "text-slate-900", bg: "bg-slate-50" },
          { label: "Outstanding", value: stats.lost, color: "text-red-600", bg: "bg-red-50" },
          { label: "Found", value: stats.found, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Returned", value: stats.returned, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className={`p-4 ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items or reporter name..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div className="flex gap-1 bg-slate-50 rounded-lg border border-slate-200 p-1">
          {["All", "Lost", "Found", "Returned"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${statusFilter === s ? "bg-white shadow-sm text-[#1e3a6e]" : "text-slate-500 hover:text-slate-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reported By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{item.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{item.location}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{item.dateLost}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{item.reportedBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedItem(item)} className="text-xs text-blue-600 hover:underline font-medium">View</button>
                      {item.status === "Lost" && (
                        <button onClick={() => updateStatus(item.id, "Found")} className="text-xs text-amber-600 hover:underline font-medium">Mark Found</button>
                      )}
                      {item.status === "Found" && (
                        <button onClick={() => setReturnModal(item)} className="text-xs text-green-600 hover:underline font-medium">Mark Returned</button>
                      )}
                      <button onClick={() => setDeleteModal(item)} className="text-xs text-red-600 hover:underline font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">No items match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Item detail modal */}
      {selectedItem && (
        <Modal title="Item Details" onClose={() => setSelectedItem(null)} actions={
          <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
        }>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">{selectedItem.name}</h4>
              <StatusBadge status={selectedItem.status} />
            </div>
            {[
              { label: "Category", value: selectedItem.category },
              { label: "Description", value: selectedItem.description },
              { label: "Location", value: selectedItem.location },
              { label: "Date Lost", value: selectedItem.dateLost },
              { label: "Reported By", value: selectedItem.reportedBy },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</p>
                <p className="text-sm text-slate-700 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Return modal */}
      {returnModal && (
        <Modal title="Mark as Returned" onClose={() => setReturnModal(null)} actions={<>
          <Button variant="outline" onClick={() => setReturnModal(null)}>Cancel</Button>
          <Button onClick={() => updateStatus(returnModal.id, "Returned")}>Confirm Return</Button>
        </>}>
          <p className="text-slate-600 text-sm mb-3">Confirm that <strong>{returnModal.name}</strong> has been returned to <strong>{returnModal.reportedBy}</strong>.</p>
          <p className="text-xs text-slate-400">Return notes aren't persisted yet — this just flips the status to Returned.</p>
        </Modal>
      )}

      {/* Delete modal */}
      {deleteModal && (
        <Modal title="Delete Record" onClose={() => setDeleteModal(null)} actions={<>
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteRecord(deleteModal.id)}>Delete Record</Button>
        </>}>
          <p className="text-slate-600 text-sm">Permanently delete the record for <strong>{deleteModal.name}</strong> (reported by {deleteModal.reportedBy})? This cannot be undone.</p>
        </Modal>
      )}

      {/* Register found item */}
      {foundModal && (
        <FoundItemModal
          onClose={() => setFoundModal(false)}
          onSubmit={async (form) => {
            try {
              await registerFoundItem(form);
              setFoundModal(false);
              showToast("Found item registered.");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Could not register item.", "error");
            }
          }}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function FoundItemModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (form: { name: string; description: string; location: string; dateFound: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", description: "", location: "", dateFound: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <Modal title="Register Found Item" onClose={onClose} actions={<>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.location || !form.dateFound}>
        {submitting ? "Registering…" : "Register Item"}
      </Button>
    </>}>
      <div className="space-y-3">
        <Input label="Item name" placeholder="e.g. Black laptop bag" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Description" placeholder="Describe the item" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Input label="Found location" placeholder="e.g. Library, Ground Floor" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <Input label="Date found" type="date" required value={form.dateFound} onChange={e => setForm(f => ({ ...f, dateFound: e.target.value }))} />
      </div>
    </Modal>
  );
}
