import { useState, useEffect } from "react";
import type { Page, Textbook } from "../types";
import { api } from "../lib/api";
import { Card, Badge, Button, PageHeader, EmptyState, Input, Textarea, Select, Toast, Modal, ContactDetails } from "../components/ui";

interface Props {
  subPage: Page;
  onNavigate: (page: Page) => void;
}

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"] as const;

export default function Marketplace({ subPage, onNavigate }: Props) {
  const [books, setBooks] = useState<Textbook[]>([]);
  const [myListings, setMyListings] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Textbook | null>(null);
  const [search, setSearch] = useState("");
  const [condFilter, setCondFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Textbook | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.textbooks
      .list()
      .then((data: any) => setBooks(data))
      .catch(() => showToast("Failed to load textbooks.", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (subPage !== "my-listings") return;
    api.textbooks.mine().then((data: any) => setMyListings(data)).catch(() => showToast("Failed to load your listings.", "error"));
  }, [subPage]);

  const filtered = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.moduleCode.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCond = condFilter === "All" || b.condition === condFilter;
    const matchPrice = priceFilter === "All" || (priceFilter === "Under R200" && b.price < 200) || (priceFilter === "R200–R350" && b.price >= 200 && b.price <= 350) || (priceFilter === "Over R350" && b.price > 350);
    return matchSearch && matchCond && matchPrice;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.textbooks.remove(deleteTarget.id);
      setBooks(bs => bs.filter(b => b.id !== deleteTarget.id));
      setMyListings(ls => ls.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Listing deleted.", "info");
      if (subPage === "textbook-detail") onNavigate("marketplace");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete listing.", "error");
    }
  };

  const deleteModalEl = deleteTarget && (
    <Modal title="Delete Listing" onClose={() => setDeleteTarget(null)} actions={<>
      <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete Listing</Button>
    </>}>
      <p className="text-slate-600 text-sm">Permanently delete your listing for <strong>{deleteTarget.title}</strong>? This cannot be undone.</p>
    </Modal>
  );

  const handleCreate = async (data: any) => {
    const created: Textbook = await api.textbooks.create(data);
    setBooks(bs => [created, ...bs]);
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto text-center py-16 text-slate-400 text-sm">Loading marketplace…</div>;
  }

  if (subPage === "sell-textbook") {
    return <SellForm onNavigate={onNavigate} showToast={showToast} toast={toast} onCreate={handleCreate} />;
  }

  if (subPage === "my-listings") {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader title="My Listings" subtitle="Textbooks you have listed for sale" actions={<Button size="sm" onClick={() => onNavigate("sell-textbook")}>+ Sell Textbook</Button>} />
        {myListings.length === 0 ? (
          <EmptyState icon="◈" title="You haven't listed any textbooks yet." description="Start selling your used textbooks to fellow students." action={<Button onClick={() => onNavigate("sell-textbook")}>List a Textbook</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myListings.map(book => (
              <Card key={book.id} className="overflow-hidden flex flex-col">
                <img src={book.image} alt={book.title} className="w-full h-36 object-cover bg-slate-100" />
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{book.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">R{book.price} · {book.condition}</p>
                  <div className="mt-3">
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(book)}>Delete listing</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  if (subPage === "textbook-detail" && selectedBook) {
    const b = books.find(bk => bk.id === selectedBook.id) ?? selectedBook;
    const condColor: Record<string, "success" | "info" | "neutral" | "warning"> = { Excellent: "success", Good: "info", Fair: "neutral", Poor: "warning" };
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => onNavigate("marketplace")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
          ← Back to Marketplace
        </button>
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[3/4]">
              <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-3">
            <Badge variant="info">{b.moduleCode}</Badge>
            <h1 className="font-serif text-2xl text-slate-900 mt-2 leading-tight">{b.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{b.author}</p>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-[#1e3a6e]">R{b.price}</span>
              <Badge variant={condColor[b.condition]}>{b.condition}</Badge>
              {!b.available && <Badge variant="neutral">Sold</Badge>}
            </div>

            <p className="text-sm text-slate-600 mt-4 leading-relaxed">{b.description}</p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { label: "Edition Year", value: b.year },
                { label: "ISBN", value: b.isbn ?? "N/A" },
                { label: "Module", value: b.module },
                { label: "Seller", value: b.seller },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-slate-900">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {b.mine ? (
                <p className="text-sm text-slate-500">This is your listing.</p>
              ) : b.available ? (
                <ContactDetails title="Contact seller" name={b.seller} email={b.sellerEmail} />
              ) : (
                <p className="text-sm text-slate-500">This textbook is no longer available.</p>
              )}
            </div>
            {b.mine && (
              <div className="mt-3">
                <Button variant="danger" onClick={() => setDeleteTarget(b)}>Delete listing</Button>
              </div>
            )}
          </div>
        </div>
        {deleteModalEl}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Marketplace home
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Textbook Marketplace"
        subtitle="Buy and sell second-hand academic textbooks"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("my-listings")}>My Listings</Button>
            <Button size="sm" onClick={() => onNavigate("sell-textbook")}>+ Sell Textbook</Button>
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
            placeholder="Search by title, author, or module code..."
            className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <select value={condFilter} onChange={e => setCondFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option>All</option>
          {CONDITIONS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option>All</option>
          <option>Under R200</option>
          <option>R200–R350</option>
          <option>Over R350</option>
        </select>
      </Card>

      <p className="text-xs text-slate-400 mb-4 font-mono">{filtered.length} {filtered.length === 1 ? "listing" : "listings"} found</p>

      {filtered.length === 0 ? (
        <EmptyState icon="◈" title="No textbooks found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(book => (
            <Card key={book.id} className="overflow-hidden flex flex-col" onClick={() => { setSelectedBook(book); onNavigate("textbook-detail"); }}>
              <div className="relative">
                <img src={book.image} alt={book.title} className="w-full h-44 object-cover bg-slate-100" />
                {!book.available && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border">Sold</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-mono text-slate-400">{book.moduleCode}</span>
                  <Badge variant={book.condition === "Excellent" ? "success" : book.condition === "Good" ? "info" : "neutral"}>
                    {book.condition}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">{book.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{book.author}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#1e3a6e]">R{book.price}</span>
                  <span className="text-xs text-slate-500">{book.seller}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SellForm({ onNavigate, showToast, toast, onCreate }: {
  onNavigate: (p: Page) => void;
  showToast: (m: string, t?: any) => void;
  toast: any;
  onCreate: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "", author: "", module: "", moduleCode: "", year: "", isbn: "",
    condition: "Good", price: "", description: "",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop&auto=format",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        title: form.title,
        author: form.author,
        module: form.module,
        moduleCode: form.moduleCode,
        year: Number(form.year),
        isbn: form.isbn || undefined,
        condition: form.condition.toUpperCase(), // API expects EXCELLENT/GOOD/FAIR/POOR
        price: Number(form.price),
        description: form.description,
        image: form.image,
      });
      setSubmitted(true);
      showToast("Textbook listing created.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not create listing.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => onNavigate("marketplace")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition">
        ← Back to Marketplace
      </button>
      <PageHeader title="Sell a Textbook" subtitle="List your second-hand textbook for fellow students" />
      {submitted ? (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h3 className="font-semibold text-slate-900 mb-1">Listing Created</h3>
          <p className="text-sm text-slate-500 mb-4">Your textbook has been listed on the marketplace.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => onNavigate("my-listings")}>View My Listings</Button>
            <Button variant="outline" onClick={() => onNavigate("marketplace")}>Browse Marketplace</Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Book title" placeholder="e.g. Introduction to Algorithms" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Author(s)" placeholder="e.g. Cormen, Leiserson, Rivest, Stein" required value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Module name" placeholder="e.g. Algorithms" required value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} />
              <Input label="Module code" placeholder="e.g. COS212" required value={form.moduleCode} onChange={e => setForm(f => ({ ...f, moduleCode: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Edition year" type="number" placeholder="e.g. 2020" required value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              <Input label="ISBN (optional)" placeholder="978-..." value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Condition" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </Select>
              <Input label="Price (Rands)" type="number" placeholder="e.g. 280" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <Input label="Cover image URL" placeholder="https://..." required value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            <Textarea label="Description" placeholder="Describe the condition — any highlighting, markings, missing pages, etc." required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Listing…" : "Create Listing"}</Button>
              <Button variant="outline" type="button" onClick={() => onNavigate("marketplace")}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => {}} />}
    </div>
  );
}
