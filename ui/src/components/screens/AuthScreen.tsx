import { useState, type FormEvent } from "react";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { registerAccount, signIn } from "../../lib/api";
import type { AuthResponse } from "../../types";

interface AuthScreenProps {
  onAuthenticated: (response: AuthResponse) => void;
  onContinueAsGuest?: () => void;
  initialMode?: "register" | "login";
  onBackToLanding?: () => void;
}

export function AuthScreen({
  onAuthenticated,
  onContinueAsGuest,
  initialMode = "login",
  onBackToLanding,
}: AuthScreenProps) {
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response =
        mode === "register"
          ? await registerAccount(email.trim(), password)
          : await signIn(email.trim(), password);
      onAuthenticated(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate. Verify server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col justify-between p-6 sm:p-12">
      {/* Editorial Top Mark */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-serif italic font-bold text-lg text-[var(--accent)]">
            A
          </span>
          <span className="font-serif text-sm font-medium tracking-tight text-[var(--text-primary)]">
            Resource Atlas
          </span>
        </div>
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Back to Overview
          </button>
        )}
      </header>

      {/* Centered Editorial Form */}
      <main className="w-full max-w-sm mx-auto space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
            {mode === "login" ? "Sign in to field notes" : "Create your study archive"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            A quiet compass for deliberate study.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs flex items-start gap-2"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@field.org"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label
                htmlFor="auth-password"
                className="font-semibold text-[var(--text-primary)]"
              >
                Password
              </label>
              {mode === "register" && (
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  Min 12 chars
                </span>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign in" : "Create account"}</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-2 text-center text-xs text-[var(--text-secondary)] space-y-2">
          <p>
            {mode === "login" ? "First time using Resource Atlas?" : "Already possess an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "login" ? "register" : "login");
              }}
              className="text-[var(--accent)] hover:underline font-medium"
            >
              {mode === "login" ? "Register here" : "Sign in here"}
            </button>
          </p>

          {onContinueAsGuest && (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-[11px] font-mono text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline"
            >
              Preview sample workspace without sign in
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-[var(--text-tertiary)]">
        Private local installation · SQLite PBKDF2 salt & JWT encryption
      </footer>
    </div>
  );
}
