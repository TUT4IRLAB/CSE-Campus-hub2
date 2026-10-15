import { useState } from "react";
import { Button, Input } from "../components/ui";
import type { User } from "../types";
import { api, setToken } from "../lib/api";

type AuthPage = "login" | "register" | "forgot";

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [page, setPage] = useState<AuthPage>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);

  // Register form state (previously these inputs had no state at all).
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }

    setLoading(true);
    try {
      const { token, user } = await api.auth.login(email, password);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }

    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      await api.auth.register({
        firstName,
        lastName,
        studentNumber,
        phone,
        email: regEmail,
        password: regPassword,
      });
      setRegisterDone(true);
      setTimeout(() => { setPage("login"); setRegisterDone(false); }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex">
      {/* Left panel — hero */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-[#1e3a6e] text-white p-12 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#1e3a6e] font-bold text-base">CH</span>
            </div>
            <div>
              <p className="font-semibold">Campus Hub</p>
              <p className="text-white/50 text-xs">Your campus, connected.</p>
            </div>
          </div>

          <h1 className="font-serif text-4xl leading-tight mb-4">
            Everything you need for campus life.
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Study groups, lost & found, textbooks, and campus events — all in one place.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { icon: "⊹", label: "StudyConnect", desc: "Find your study group" },
              { icon: "◎", label: "Lost & Found", desc: "Recover lost items" },
              { icon: "◈", label: "Marketplace", desc: "Buy & sell textbooks" },
              { icon: "◷", label: "Events", desc: "Discover what's on" },
            ].map(f => (
              <div key={f.label} className="bg-white/8 rounded-xl p-4">
                <span className="text-xl">{f.icon}</span>
                <p className="font-semibold text-sm mt-2">{f.label}</p>
                <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">Campus Hub v1.0</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#1e3a6e] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CH</span>
            </div>
            <p className="font-semibold text-[#1e3a6e]">Campus Hub</p>
          </div>

          {page === "login" && (
            <>
              <h2 className="font-serif text-2xl text-slate-900 mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm mb-6">Sign in to your campus account</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input label="University email" type="email" placeholder="u12345678@tuks.co.za" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <button type="button" onClick={() => setPage("forgot")} className="text-xs text-blue-600 hover:underline">Forgot password?</button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                {error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                No account?{" "}
                <button onClick={() => setPage("register")} className="text-blue-600 font-medium hover:underline">Register here</button>
              </p>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <strong>Demo accounts</strong> (seeded, role is determined by the account — not a toggle):<br />
                Students: lerato.mokoena@campus.ac.za, kabelo.mahlangu@campus.ac.za<br />
                Security: sipho.dlamini@campus.ac.za, zanele.mthembu@campus.ac.za<br />
                Admin: admin@campus.ac.za<br />
                Password for all: password123
              </div>
            </>
          )}

          {page === "register" && (
            <>
              <h2 className="font-serif text-2xl text-slate-900 mb-1">Create account</h2>
              <p className="text-slate-500 text-sm mb-6">Register with your university email</p>

              {registerDone ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                  ✓ Registration successful! Redirecting to login…
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" placeholder="Lerato" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                    <Input label="Last name" placeholder="Mokoena" required value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                  <Input label="Student number" placeholder="u21045832" required value={studentNumber} onChange={e => setStudentNumber(e.target.value)} />
                  <Input label="Phone number" type="tel" placeholder="e.g. 082 123 4567" required value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input label="University email" type="email" placeholder="u12345678@tuks.co.za" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                  <Input label="Password" type="password" placeholder="Min. 8 characters" required value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                  <Input label="Confirm password" type="password" placeholder="Repeat password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  {error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              )}

              <p className="text-center text-sm text-slate-500 mt-5">
                Already have an account?{" "}
                <button onClick={() => setPage("login")} className="text-blue-600 font-medium hover:underline">Sign in</button>
              </p>
            </>
          )}

          {page === "forgot" && (
            <>
              <button onClick={() => setPage("login")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition">
                ← Back to login
              </button>
              <h2 className="font-serif text-2xl text-slate-900 mb-1">Reset password</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your university email and we will send a reset link.</p>

              {forgotSent ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ If that email is registered, a reset link has been sent to <strong>{email}</strong>.
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  {error && <p className="text-red-600 text-xs bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
                  <Input label="University email" type="email" placeholder="u12345678@tuks.co.za" value={email} onChange={e => setEmail(e.target.value)} />
                  <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
