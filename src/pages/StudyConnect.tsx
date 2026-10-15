import { useState, useEffect } from "react";
import type { Page, StudyGroup } from "../types";
import { api } from "../lib/api";
import { Card, Badge, Button, PageHeader, EmptyState, Input, Select, Modal, Toast, ContactDetails } from "../components/ui";

interface Props {
  subPage: Page;
  onNavigate: (page: Page) => void;
}

export default function StudyConnect({ subPage, onNavigate }: Props) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [leaveModal, setLeaveModal] = useState(false);
  const [joinModal, setJoinModal] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudyGroup | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.studyGroups
      .list()
      .then((data: any) => setGroups(data))
      .catch(() => showToast("Failed to load study groups.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.moduleCode.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "All" || g.moduleCode === moduleFilter;
    return matchSearch && matchModule;
  });

  const myGroups = groups.filter(g => g.joined);

  const handleJoin = async (id: string) => {
    try {
      const updated: StudyGroup = await api.studyGroups.join(id);
      setGroups(gs => gs.map(g => g.id === id ? updated : g));
      setJoinModal(null);
      showToast("You have joined the study group.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not join group.", "error");
    }
  };

  const handleLeave = async () => {
    if (!selectedGroup) return;
    try {
      const updated: StudyGroup = await api.studyGroups.leave(selectedGroup.id);
      setGroups(gs => gs.map(g => g.id === updated.id ? updated : g));
      setLeaveModal(false);
      showToast("You have left the study group.", "info");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not leave group.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.studyGroups.remove(deleteTarget.id);
      setGroups(gs => gs.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Study group deleted.", "info");
      if (subPage === "study-group-detail") onNavigate("study-connect");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete group.", "error");
    }
  };

  const deleteModalEl = deleteTarget && (
    <Modal title="Delete Study Group" onClose={() => setDeleteTarget(null)} actions={<>
      <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete Group</Button>
    </>}>
      <p className="text-slate-600 text-sm">Permanently delete <strong>{deleteTarget.name}</strong>? All members will be removed from the group. This cannot be undone.</p>
    </Modal>
  );

  const handleCreate = async (form: { name: string; module: string; moduleCode: string; date: string; time: string; location: string; maxMembers: string; topics: string }) => {
    const created: StudyGroup = await api.studyGroups.create({
      name: form.name,
      module: form.module,
      moduleCode: form.moduleCode,
      date: form.date,
      time: form.time,
      location: form.location,
      maxMembers: Number(form.maxMembers),
      topics: form.topics.split(",").map(t => t.trim()).filter(Boolean),
    });
    setGroups(gs => [created, ...gs]);
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto text-center py-16 text-slate-400 text-sm">Loading study groups…</div>;
  }

  if (subPage === "create-study-group") {
    return <CreateGroupForm onNavigate={onNavigate} showToast={showToast} toast={toast} onCreate={handleCreate} />;
  }

  if (subPage === "my-study-groups") {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="My Study Groups"
          subtitle="Groups you have joined"
          actions={<Button onClick={() => onNavigate("create-study-group")} size="sm">+ Create Group</Button>}
        />
        {myGroups.length === 0 ? (
          <EmptyState icon="⊹" title="No active study groups" description="Join a study group to see it here." action={<Button onClick={() => onNavigate("study-connect")}>Find a Group</Button>} />
        ) : (
          <div className="space-y-4">
            {myGroups.map(g => (
              <GroupCard key={g.id} group={g} onSelect={() => { setSelectedGroup(g); onNavigate("study-group-detail"); }} onLeave={() => { setSelectedGroup(g); setLeaveModal(true); }} onDelete={() => setDeleteTarget(g)} />
            ))}
          </div>
        )}
        {leaveModal && selectedGroup && (
          <Modal title="Leave Study Group" onClose={() => setLeaveModal(false)} actions={<>
            <Button variant="outline" onClick={() => setLeaveModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLeave}>Leave Group</Button>
          </>}>
            <p className="text-slate-600 text-sm">Are you sure you want to leave <strong>{selectedGroup.name}</strong>? You can rejoin if there is capacity.</p>
          </Modal>
        )}
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (subPage === "study-group-detail" && selectedGroup) {
    const g = groups.find(gr => gr.id === selectedGroup.id) ?? selectedGroup;
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => onNavigate("study-connect")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
          ← Back to groups
        </button>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Badge variant="info">{g.moduleCode}</Badge>
              <h2 className="font-serif text-2xl text-slate-900 mt-2">{g.name}</h2>
              <p className="text-slate-500 text-sm mt-1">Organised by {g.owner}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Date", value: g.date },
              { label: "Time", value: g.time },
              { label: "Location", value: g.location },
              { label: "Members", value: `${g.members} / ${g.maxMembers}` },
            ].map(f => (
              <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-slate-900">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Topics</p>
            <div className="flex flex-wrap gap-2">
              {g.topics.map(t => (
                <span key={t} className="px-3 py-1 bg-[#1e3a6e]/6 text-[#1e3a6e] text-xs rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>

          {!g.isOwner && (
            <div className="mb-6">
              <ContactDetails title="Contact organiser" name={g.owner} email={g.ownerEmail} />
            </div>
          )}

          <div className="flex gap-3">
            {g.isOwner ? (
              <Button variant="danger" onClick={() => setDeleteTarget(g)}>Delete Group</Button>
            ) : g.joined ? (
              <Button variant="outline" onClick={() => setLeaveModal(true)}>Leave Group</Button>
            ) : (
              <Button onClick={() => handleJoin(g.id)} disabled={g.members >= g.maxMembers}>
                {g.members >= g.maxMembers ? "Group Full" : "Join Group"}
              </Button>
            )}
          </div>
        </Card>

        {leaveModal && (
          <Modal title="Leave Study Group" onClose={() => setLeaveModal(false)} actions={<>
            <Button variant="outline" onClick={() => setLeaveModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLeave}>Leave Group</Button>
          </>}>
            <p className="text-slate-600 text-sm">Are you sure you want to leave <strong>{g.name}</strong>?</p>
          </Modal>
        )}
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Discovery page
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="StudyConnect"
        subtitle="Find and join study groups on campus"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("my-study-groups")}>My Groups</Button>
            <Button size="sm" onClick={() => onNavigate("create-study-group")}>+ Create Group</Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by group name or module..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option>All</option>
          {[...new Set(groups.map(g => g.moduleCode))].map(m => <option key={m}>{m}</option>)}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon="⊹" title="No study groups found" description="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-4">
          {filtered.map(g => (
            <GroupCard
              key={g.id}
              group={g}
              onSelect={() => { setSelectedGroup(g); onNavigate("study-group-detail"); }}
              onJoin={() => setJoinModal(g.id)}
              onLeave={() => { setSelectedGroup(g); setLeaveModal(true); }} onDelete={() => setDeleteTarget(g)}
            />
          ))}
        </div>
      )}

      {joinModal && (
        <Modal title="Join Study Group" onClose={() => setJoinModal(null)} actions={<>
          <Button variant="outline" onClick={() => setJoinModal(null)}>Cancel</Button>
          <Button onClick={() => handleJoin(joinModal)}>Confirm Join</Button>
        </>}>
          <p className="text-slate-600 text-sm">Join <strong>{groups.find(g => g.id === joinModal)?.name}</strong>? The group owner will be notified.</p>
        </Modal>
      )}
      {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function GroupCard({ group: g, onSelect, onJoin, onLeave, onDelete }: {
  group: StudyGroup;
  onSelect: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
}) {
  const pct = (g.members / g.maxMembers) * 100;
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="info">{g.moduleCode}</Badge>
            {g.joined && <Badge variant="success">Joined</Badge>}
            {g.isOwner && <Badge variant="warning">Yours</Badge>}
          </div>
          <h3 className="font-semibold text-slate-900 cursor-pointer hover:text-blue-700 transition" onClick={onSelect}>{g.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            <span>📅 {g.date}</span>
            <span>🕐 {g.time}</span>
            <span>📍 {g.location}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {g.topics.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{t}</span>
            ))}
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{g.members}/{g.maxMembers}</p>
            <p className="text-[10px] text-slate-400 mb-1">members</p>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1e3a6e] rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {g.joined ? (
            <>
              <Button size="sm" variant="outline" onClick={onSelect}>View Group</Button>
              {g.isOwner ? (
                <button onClick={onDelete} className="text-xs text-red-500 hover:underline">Delete</button>
              ) : (
                <button onClick={onLeave} className="text-xs text-red-500 hover:underline">Leave</button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={onJoin} disabled={g.members >= g.maxMembers}>
              {g.members >= g.maxMembers ? "Full" : "Join"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CreateGroupForm({ onNavigate, showToast, toast, onCreate }: {
  onNavigate: (p: Page) => void;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
  toast: any;
  onCreate: (form: { name: string; module: string; moduleCode: string; date: string; time: string; location: string; maxMembers: string; topics: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", module: "", moduleCode: "", date: "", time: "", location: "", maxMembers: "8", topics: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(form);
      showToast("Study group created successfully.");
      setTimeout(() => onNavigate("my-study-groups"), 1000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create group.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => onNavigate("study-connect")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
        ← Back to groups
      </button>
      <PageHeader title="Create Study Group" subtitle="Set up a new study session" />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Group name" placeholder="e.g. COS301 Final Exam Prep" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Module name" placeholder="e.g. Software Engineering" value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} required />
            <Input label="Module code" placeholder="e.g. COS301" value={form.moduleCode} onChange={e => setForm(f => ({ ...f, moduleCode: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            <Input label="Time" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
          </div>
          <Input label="Location" placeholder="e.g. Campus Library, Level 3" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          <Select label="Maximum members" value={form.maxMembers} onChange={e => setForm(f => ({ ...f, maxMembers: e.target.value }))}>
            {[4, 6, 8, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} members</option>)}
          </Select>
          <Input label="Topics (comma-separated)" placeholder="e.g. Data Structures, Recursion, Graphs" value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Creating…" : "Create Study Group"}</Button>
            <Button variant="outline" type="button" onClick={() => onNavigate("study-connect")}>Cancel</Button>
          </div>
        </form>
      </Card>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => {}} />}
    </div>
  );
}
