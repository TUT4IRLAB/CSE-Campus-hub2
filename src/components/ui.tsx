import { type ReactNode, type ButtonHTMLAttributes } from "react";

// ── Badge ──────────────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "neutral";
export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-blue-50 text-blue-700 ring-blue-200",
    success: "bg-green-50 text-green-700 ring-green-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    error: "bg-red-50 text-red-700 ring-red-200",
    info: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    Lost: "error",
    Found: "warning",
    Returned: "success",
    Available: "success",
    Sold: "neutral",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}

// ── Button ─────────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}
export function Button({ variant = "primary", size = "md", children, className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#1e3a6e] text-white hover:bg-[#162d58] active:bg-[#0f2040]",
    secondary: "bg-[#f0f4fb] text-[#1e3a6e] hover:bg-[#dce8fb] border border-[#c7d9f5]",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  };
  const sizes: Record<string, string> = {
    sm: "text-xs px-3 py-1.5 h-7",
    md: "text-sm px-4 py-2 h-9",
    lg: "text-sm px-5 py-2.5 h-10",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md hover:border-slate-300 transition-all" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input
        className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        {...props}
      />
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────────
export function Textarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        rows={4}
        {...props}
      />
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────
export function Select({ label, children, ...props }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="font-medium text-slate-800">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg z-50 text-sm font-medium ${styles[type]}`}>
      <span>{icons[type]}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, actions }: { title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {actions && <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">{actions}</div>}
      </div>
    </div>
  );
}

// ── Page header ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="font-serif text-2xl text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{children}</p>;
}

// ── Contact details (email) ────────────────────────────────────────────────────
export function ContactDetails({ title, name, email }: { title: string; name: string; email?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{title}</p>
      <p className="text-sm font-medium text-slate-900 mb-2">{name}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">✉</span>
        {email ? <a href={`mailto:${email}`} className="text-blue-600 hover:underline break-all">{email}</a> : <span className="text-slate-400">Not provided</span>}
      </div>
    </div>
  );
}
