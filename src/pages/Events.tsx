import { useState, useEffect } from "react";
import type { Page, CampusEvent } from "../types";
import { api } from "../lib/api";
import { Card, Badge, Button, PageHeader, EmptyState, Input, Textarea, Select, Toast, Modal } from "../components/ui";

interface Props {
  subPage: Page;
  onNavigate: (page: Page) => void;
}

const CATEGORY_COLORS: Record<string, "info" | "success" | "warning" | "neutral" | "error"> = {
  Career: "success",
  Academic: "info",
  "Student Society": "warning",
  Sports: "neutral",
  Workshop: "info",
  Social: "neutral",
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Matches the "Friday, 26 Sep 2026" format of seeded events (the dashboard parses day/month from it).
function formatEventDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export default function Events({ subPage, onNavigate }: Props) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [registerModal, setRegisterModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampusEvent | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.events
      .list()
      .then((data: any) => setEvents(data))
      .catch(() => showToast("Failed to load events.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(ev => {
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || ev.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || ev.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleRegister = async (id: string) => {
    try {
      const updated: CampusEvent = await api.events.register(id);
      setEvents(es => es.map(ev => ev.id === id ? updated : ev));
      setRegisterModal(false);
      showToast("You have registered for this event.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not register.", "error");
    }
  };

  const handleCreate = async (data: any) => {
    const created: CampusEvent = await api.events.create(data);
    setEvents(es => [...es, created]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.events.remove(deleteTarget.id);
      setEvents(es => es.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Event deleted.", "info");
      if (subPage === "event-detail") onNavigate("events");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete event.", "error");
    }
  };

  const deleteModalEl = deleteTarget && (
    <Modal title="Delete Event" onClose={() => setDeleteTarget(null)} actions={<>
      <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete Event</Button>
    </>}>
      <p className="text-slate-600 text-sm">Permanently delete <strong>{deleteTarget.title}</strong>? All {deleteTarget.attendees} registration(s) will be removed. This cannot be undone.</p>
    </Modal>
  );

  if (loading) {
    return <div className="max-w-5xl mx-auto text-center py-16 text-slate-400 text-sm">Loading events…</div>;
  }

  if (subPage === "create-event") {
    return <CreateEventForm onNavigate={onNavigate} showToast={showToast} toast={toast} onCreate={handleCreate} />;
  }

  if (subPage === "my-events") {
    const myEvents = events.filter(ev => ev.registered);
    const organising = events.filter(ev => ev.mine);
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="My Events"
          subtitle="Events you've registered for and events you're organising"
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => onNavigate("events")}>Browse Events</Button>
              <Button size="sm" onClick={() => onNavigate("create-event")}>+ Create Event</Button>
            </div>
          }
        />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Registered</p>
        {myEvents.length === 0 ? (
          <EmptyState icon="◷" title="No upcoming events." description="You haven't registered for any events." action={<Button onClick={() => onNavigate("events")}>Browse Events</Button>} />
        ) : (
          <div className="space-y-4">
            {myEvents.map(ev => (
              <EventCard key={ev.id} event={ev} onSelect={() => { setSelectedEvent(ev); onNavigate("event-detail"); }} onDelete={() => setDeleteTarget(ev)} />
            ))}
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-8 mb-3">Organising</p>
        {organising.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-slate-500 text-sm">You haven't created any events. <button onClick={() => onNavigate("create-event")} className="text-blue-600 hover:underline">Create one</button></p>
          </Card>
        ) : (
          <div className="space-y-4">
            {organising.map(ev => (
              <EventCard key={ev.id} event={ev} onSelect={() => { setSelectedEvent(ev); onNavigate("event-detail"); }} onDelete={() => setDeleteTarget(ev)} />
            ))}
          </div>
        )}
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (subPage === "event-detail" && selectedEvent) {
    const ev = events.find(e => e.id === selectedEvent.id) ?? selectedEvent;
    const pct = Math.round((ev.attendees / ev.capacity) * 100);
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => onNavigate("events")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
          ← Back to Events
        </button>
        <Card className="overflow-hidden">
          <img src={ev.image} alt={ev.title} className="w-full h-48 object-cover bg-slate-100" />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant={CATEGORY_COLORS[ev.category] ?? "neutral"}>{ev.category}</Badge>
                <h1 className="font-serif text-2xl text-slate-900 mt-2 leading-tight">{ev.title}</h1>
                <p className="text-slate-500 text-sm mt-1">Organised by {ev.organiser}</p>
              </div>
              {ev.registered && <Badge variant="success">Registered</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Date", value: ev.date },
                { label: "Time", value: ev.time },
                { label: "Location", value: ev.location },
                { label: "Capacity", value: `${ev.attendees} / ${ev.capacity}` },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-slate-900">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Attendance</span><span>{pct}% full</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1e3a6e] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mt-5 mb-6">{ev.description}</p>

            <Button
              onClick={() => ev.registered ? null : setRegisterModal(true)}
              variant={ev.registered ? "secondary" : "primary"}
              disabled={!ev.registered && ev.attendees >= ev.capacity}
              className="w-full"
            >
              {ev.registered ? "✓ Registered" : ev.attendees >= ev.capacity ? "Event Full" : "Register for Event"}
            </Button>
            {ev.mine && (
              <Button variant="danger" className="w-full mt-3" onClick={() => setDeleteTarget(ev)}>Delete Event</Button>
            )}
          </div>
        </Card>

        {registerModal && (
          <Modal title="Register for Event" onClose={() => setRegisterModal(false)} actions={<>
            <Button variant="outline" onClick={() => setRegisterModal(false)}>Cancel</Button>
            <Button onClick={() => handleRegister(ev.id)}>Confirm Registration</Button>
          </>}>
            <p className="text-slate-600 text-sm">Register for <strong>{ev.title}</strong>?</p>
            <p className="text-xs text-slate-500 mt-1">You will receive a confirmation email at your university address.</p>
          </Modal>
        )}
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Events listing
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Campus Events"
        subtitle="Discover upcoming events at your university"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("my-events")}>My Events</Button>
            <Button size="sm" onClick={() => onNavigate("create-event")}>+ Create Event</Button>
          </div>
        }
      />

      <Card className="p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option>All</option>
          {["Academic", "Career", "Sports", "Student Society", "Workshop", "Social"].map(c => <option key={c}>{c}</option>)}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon="◷" title="No upcoming events." description="Check back soon for new events." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map(ev => (
            <EventCard key={ev.id} event={ev} onSelect={() => { setSelectedEvent(ev); onNavigate("event-detail"); }} onRegister={() => handleRegister(ev.id)} onDelete={() => setDeleteTarget(ev)} />
          ))}
        </div>
      )}
      {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function EventCard({ event: ev, onSelect, onRegister, onDelete }: { event: CampusEvent; onSelect: () => void; onRegister?: () => void; onDelete?: () => void }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative cursor-pointer" onClick={onSelect}>
        <img src={ev.image} alt={ev.title} className="w-full h-36 object-cover bg-slate-100" />
        <div className="absolute top-3 left-3">
          <Badge variant={CATEGORY_COLORS[ev.category] ?? "neutral"}>{ev.category}</Badge>
        </div>
        {(ev.registered || ev.mine) && (
          <div className="absolute top-3 right-3 flex gap-1">
            {ev.mine && <Badge variant="warning">Yours</Badge>}
            {ev.registered && <Badge variant="success">Registered</Badge>}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug cursor-pointer hover:text-blue-700 transition" onClick={onSelect}>{ev.title}</h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
          <span>📅 {ev.date}</span>
          <span>🕐 {ev.time}</span>
          <span>📍 {ev.location.split(",")[0]}</span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mt-2 flex-1">{ev.description}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">{ev.attendees}/{ev.capacity} registered</span>
          <div className="flex items-center gap-3">
            {ev.mine && onDelete && (
              <button onClick={onDelete} className="text-xs text-red-500 hover:underline">Delete</button>
            )}
            {ev.registered ? (
              <Badge variant="success">✓ Going</Badge>
            ) : (
              <Button size="sm" variant="secondary" onClick={onSelect}>View Details</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreateEventForm({ onNavigate, showToast, toast, onCreate }: {
  onNavigate: (p: Page) => void;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
  toast: any;
  onCreate: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "", category: "Academic", date: "", startTime: "", endTime: "",
    location: "", capacity: "50", organiser: "", image: "", description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        title: form.title,
        category: form.category,
        date: formatEventDate(form.date),
        time: `${form.startTime} – ${form.endTime}`,
        location: form.location,
        capacity: Number(form.capacity),
        organiser: form.organiser || undefined, // defaults to your name on the server
        image: form.image || undefined,         // defaults to a stock image on the server
        description: form.description,
      });
      showToast("Event created.");
      setTimeout(() => onNavigate("my-events"), 800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create event.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => onNavigate("events")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
        ← Back to Events
      </button>
      <PageHeader title="Create Event" subtitle="Host an event for fellow students" />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event title" placeholder="e.g. Intro to Web Dev Workshop" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {["Academic", "Career", "Sports", "Student Society", "Workshop", "Social"].map(c => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Date" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start time" type="time" required value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            <Input label="End time" type="time" required value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
          <Input label="Location" placeholder="e.g. IT Building, Lab 2" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Capacity" type="number" min={1} required value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
            <Input label="Organiser (optional)" placeholder="Defaults to your name" value={form.organiser} onChange={e => setForm(f => ({ ...f, organiser: e.target.value }))} />
          </div>
          <Input label="Image URL (optional)" placeholder="https://..." value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
          <Textarea label="Description" placeholder="What's the event about?" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Creating…" : "Create Event"}</Button>
            <Button variant="outline" type="button" onClick={() => onNavigate("events")}>Cancel</Button>
          </div>
        </form>
      </Card>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => {}} />}
    </div>
  );
}
