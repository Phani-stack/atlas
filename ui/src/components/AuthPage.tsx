import { ArrowRight, CircleAlert, Compass, LoaderCircle, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { registerAccount, signIn } from "../lib/api";
import type { AuthResponse } from "../types";

type AuthPageProps = {
  onAuthenticated: (response: AuthResponse) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = mode === "register"
        ? await registerAccount(email.trim(), password)
        : await signIn(email.trim(), password);
      onAuthenticated(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7f8fa] lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="relative hidden overflow-hidden bg-[#171b36] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 top-10 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-indigo-500"><Compass size={23} /></span>
          <div>
            <p className="text-sm font-bold">Resource Atlas</p>
            <p className="mt-0.5 text-[10px] tracking-wide text-slate-400">YOUR LEARNING WORKSPACE</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">One account, many paths</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">Give every learning goal its own space.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            Keep roadmaps, resources, practice history, and progress organized by topic—with your work private to your account.
          </p>
        </div>
        <p className="relative text-[10px] text-slate-500">Your learning spaces are stored locally in this Resource Atlas installation.</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[410px] rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_-45px_rgba(27,39,94,0.35)] sm:p-8">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><Compass size={20} /></span>
            <span className="text-sm font-bold text-slate-900">Resource Atlas</span>
          </div>
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><LockKeyhole size={19} /></span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === "register" ? "Sign up to create private learning spaces." : "Sign in to continue your learning."}
          </p>

          {error ? (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">
              <CircleAlert size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="account-email" className="text-xs font-semibold text-slate-700">Email</label>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label htmlFor="account-password" className="text-xs font-semibold text-slate-700">Password</label>
              <input
                id="account-password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={mode === "register" ? 12 : 1}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              {mode === "register" ? <p className="mt-1.5 text-[10px] text-slate-400">Use at least 12 characters.</p> : null}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {mode === "register" ? "Create account" : "Sign in"}
              {!busy ? <ArrowRight size={15} /> : null}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === "register" ? "Already have an account?" : "New to Resource Atlas?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "register" ? "login" : "register");
              }}
              className="font-semibold text-indigo-700 hover:text-indigo-900"
            >
              {mode === "register" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
