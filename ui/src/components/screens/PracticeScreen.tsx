import { useState, useEffect, useRef } from "react";
import { MarkdownView } from "../common/MarkdownView";
import {
  Check,
  RotateCcw,
  Lightbulb,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  History,
  X,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Upload,
  Code,
  FileText,
  Trash2,
} from "lucide-react";
import {
  getTutorQuestion,
  requestTutorHint,
  replayTutorModule,
  setTutorPreference,
  skipTutorModule,
  startTutorSession,
  submitTutorAnswer,
} from "../../lib/api";
import type {
  TutorQuestion,
  TutorAnswerResult,
  TutorStatus,
  TutorHistoryEntry,
} from "../../types";

// ── Question-type options for the preference picker ───────────────────────────
const Q_TYPES = [
  { id: "mcq", label: "Multiple choice" },
  { id: "short", label: "Short answer" },
  { id: "problem", label: "Worked problem" },
  { id: "code", label: "Code" },
] as const;
type QTypeId = (typeof Q_TYPES)[number]["id"];

// ── Module-complete dialog ─────────────────────────────────────────────────────
interface ModuleCompleteDialogProps {
  moduleTitle: string;
  event: "passed" | "passed_with_gaps";
  spaceId: string;
  onContinueModule: () => void;
  onNextModule: () => void;
  onPreferenceSaved: (status: TutorStatus) => void;
}

function ModuleCompleteDialog({
  moduleTitle,
  event,
  spaceId,
  onContinueModule,
  onNextModule,
  onPreferenceSaved,
}: ModuleCompleteDialogProps) {
  const [view, setView] = useState<"main" | "preference">("main");
  const [focusNote, setFocusNote] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<QTypeId[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function toggleType(id: QTypeId) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSavePreference() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await setTutorPreference(spaceId, focusNote, selectedTypes);
      onPreferenceSaved(res.status);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save preferences.");
      setSaving(false);
    }
  }

  if (view === "preference") {
    return (
      <div className="border-hairline rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-base text-[var(--text-primary)] font-normal">
            Customise future questions
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Your note and type preferences will bias how the tutor picks and frames questions on this module from now on.
          </p>
        </div>

        {/* Focus note */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
            What to focus on
          </label>
          <textarea
            value={focusNote}
            onChange={(e) => setFocusNote(e.target.value)}
            placeholder="e.g. I keep confusing TCP and UDP — give me more comparison questions"
            rows={3}
            className="w-full p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] resize-none leading-relaxed"
            maxLength={400}
          />
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
            {focusNote.length}/400
          </span>
        </div>

        {/* Type preference */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
            Preferred question types (optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {Q_TYPES.map(({ id, label }) => {
              const on = selectedTypes.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleType(id)}
                  className={`px-3 py-1 rounded-[var(--radius-xs)] text-xs font-mono border-hairline transition-colors ${
                    on
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-[var(--status-danger)]">{saveError}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSavePreference}
            disabled={saving || (!focusNote.trim() && selectedTypes.length === 0)}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            <span>{saving ? "Saving…" : "Save & continue module"}</span>
          </button>
          <button
            type="button"
            onClick={() => setView("main")}
            className="px-3 py-2 rounded-[var(--radius-md)] border-hairline text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-hairline rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-5 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Check size={15} className="text-[var(--status-success)] shrink-0" />
          <span className="text-xs font-mono text-[var(--status-success)] font-semibold uppercase tracking-wider">
            {event === "passed" ? "Module complete" : "Module complete — with gaps"}
          </span>
        </div>
        <p className="text-sm font-serif text-[var(--text-primary)] font-normal leading-snug">
          {moduleTitle}
        </p>
        {event === "passed_with_gaps" && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            You reached the question limit with partial mastery. Some concepts may need more reinforcement.
          </p>
        )}
      </div>

      {/* Three choices */}
      <div className="space-y-2">
        {/* 1. More on this module */}
        <button
          type="button"
          onClick={onContinueModule}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-left transition-colors group"
        >
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">
              More questions on this module
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Continue practising — the tutor will target weaker concepts
            </p>
          </div>
          <ArrowRight size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0" />
        </button>

        {/* 2. Customise preference */}
        <button
          type="button"
          onClick={() => setView("preference")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-left transition-colors group"
        >
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">
              Tell us what to focus on
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Set a focus note or preferred question types for this module
            </p>
          </div>
          <ArrowRight size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0" />
        </button>

        {/* 3. Next module */}
        <button
          type="button"
          onClick={onNextModule}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-left transition-colors group"
        >
          <p className="text-xs font-medium text-white">
            Move to next module
          </p>
          <ArrowRight size={13} className="text-white/70 group-hover:text-white shrink-0" />
        </button>
      </div>
    </div>
  );
}

interface PracticeScreenProps {
  spaceId: string;
  spaceName: string;
  topic: string;
  initialStatus: TutorStatus | null;
  onStatusChange?: (newStatus: TutorStatus) => void;
}

export function PracticeScreen({
  spaceId,
  spaceName,
  topic,
  initialStatus,
  onStatusChange,
}: PracticeScreenProps) {
  const [status, setStatus] = useState<TutorStatus | null>(initialStatus);
  const [question, setQuestion] = useState<TutorQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [mcqChoice, setMcqChoice] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "solved" | "review">("all");
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<TutorHistoryEntry | null>(null);

  const [sessionStarting, setSessionStarting] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [result, setResult] = useState<TutorAnswerResult | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [completedModuleTitle, setCompletedModuleTitle] = useState<string | null>(null);
  const [completedModuleEvent, setCompletedModuleEvent] = useState<"passed" | "passed_with_gaps" | null>(null);

  // Resizable right pane width state (in pixels)
  // Left question area stays at flex-1 (fills all remaining space), while right answer area is independently resizable
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem("atlas-right-panel-width");
    return saved ? parseInt(saved, 10) : 620;
  });
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(620);
  const containerRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current || !containerRef.current) return;
      // Moving left increases right panel width; moving right decreases right panel width
      const deltaX = startXRef.current - e.clientX;
      const newWidth = startWidthRef.current + deltaX;
      const containerWidth = containerRef.current.clientWidth;
      // Clamp between min 340px and max (containerWidth - 340px)
      const clamped = Math.max(340, Math.min(containerWidth - 340, newWidth));
      setRightPanelWidth(clamped);
    }

    function handleMouseUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("atlas-right-panel-width", String(rightPanelWidth));
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [rightPanelWidth]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus, spaceId]);

  useEffect(() => {
    void loadQuestion();
  }, [spaceId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if ((e.key === "h" || e.key === "H") && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHistoryOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape") {
        if (historyOpen) setHistoryOpen(false);
        if (moreMenuOpen) setMoreMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !result && question) {
        e.preventDefault();
        void handleCheckAnswer();
        return;
      }
      if (e.key === "Enter" && result && !e.shiftKey) {
        e.preventDefault();
        void loadQuestion();
        return;
      }
      if (question?.type === "mcq" && !isInput && !result) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          setMcqChoice(String.fromCharCode(64 + num));
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, result, historyOpen, moreMenuOpen, mcqChoice, answer]);

  async function handleStartSession(reset = false) {
    setSessionStarting(true);
    setError("");
    setNotice("");
    try {
      const response = await startTutorSession(spaceId, { reset });
      setStatus(response.status);
      if (onStatusChange) onStatusChange(response.status);
      await loadQuestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start tutor practice session.");
    } finally {
      setSessionStarting(false);
    }
  }

  async function loadQuestion() {
    setQuestionLoading(true);
    setError("");
    setResult(null);
    setCompletedModuleTitle(null);
    setCompletedModuleEvent(null);
    setHints([]);
    setSourcesOpen(false);
    setMoreMenuOpen(false);

    try {
      const response = await getTutorQuestion(spaceId);
      if (response.question) {
        setQuestion(response.question);
        setAnswer(response.question.type === "code" ? response.question.code?.starter ?? "" : "");
        setMcqChoice(null);
        setQuestionStartedAt(Date.now());
      } else {
        setQuestion(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load question.";
      if (msg.includes("Start this space's practice session first")) {
        await handleStartSession();
      } else {
        setError(msg);
      }
    } finally {
      setQuestionLoading(false);
    }
  }

  async function handleCheckAnswer() {
    if (!question) return;
    const finalAnswer = question.type === "mcq" ? mcqChoice || "" : answer;
    if (!finalAnswer.trim()) return;
    setIsSubmitting(true);
    setError("");
    const seconds = Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000));
    try {
      const response = await submitTutorAnswer(spaceId, question.id, finalAnswer, seconds);
      setResult(response.result);
      setStatus(response.status);
      if (onStatusChange) onStatusChange(response.status);
      if (response.result.module_event === "passed" || response.result.module_event === "passed_with_gaps") {
        setCompletedModuleTitle(question.module_title || `Module ${question.module_id}`);
        setCompletedModuleEvent(response.result.module_event);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to evaluate answer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAskHint() {
    if (!question) return;
    setIsHintLoading(true);
    setError("");
    try {
      const response = await requestTutorHint(spaceId, question.id);
      setHints((prev) => [...prev, response.hint]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retrieve hint.");
    } finally {
      setIsHintLoading(false);
    }
  }

  async function handleSkipModule() {
    setMoreMenuOpen(false);
    setIsSubmitting(true);
    try {
      const response = await skipTutorModule(spaceId);
      setStatus(response.status);
      if (onStatusChange) onStatusChange(response.status);
      await loadQuestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to skip module.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleContinueModule() {
    setQuestionLoading(true);
    setError("");
    try {
      const res = await replayTutorModule(spaceId, question?.module_id);
      setStatus(res.status);
      if (onStatusChange) onStatusChange(res.status);
      await loadQuestion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to replay module.");
      setQuestionLoading(false);
    }
  }

  async function handlePreferenceSaved(newStatus: TutorStatus) {
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
    await handleContinueModule();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setAnswer((prev) => (prev ? prev + "\n\n" + text : text));
    };
    reader.readAsText(file);
    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }

  const allAttempts = status?.history || [];
  const filteredHistory = allAttempts.filter((entry) => {
    if (historyFilter === "solved") return entry.score >= 0.7;
    if (historyFilter === "review") return entry.score < 0.7;
    return true;
  });

  const questionTypeLabel =
    question?.type === "mcq"
      ? "Multiple Choice"
      : question?.type === "code"
      ? "Code"
      : "Short Answer";

  // ── NOT-STARTED STATE ────────────────────────────────────────────────────────
  if (!questionLoading && !question && !result && !error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)] bg-[var(--bg-canvas)]">
        <div className="max-w-sm w-full mx-4 p-8 rounded-[var(--radius-lg)] border-hairline bg-[var(--bg-surface)] text-center space-y-5">
          <div className="space-y-1">
            <h2 className="font-serif text-xl text-[var(--text-primary)] font-normal">
              Practice Session
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              RAG-grounded questions calibrated to your roadmap checkpoints for{" "}
              <span className="font-medium text-[var(--text-primary)]">{topic}</span>.
            </p>
          </div>
          {notice && (
            <p className="text-xs text-[var(--status-success)] font-mono">{notice}</p>
          )}
          <button
            type="button"
            onClick={() => handleStartSession(false)}
            disabled={sessionStarting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {sessionStarting ? <Loader2 size={13} className="animate-spin" /> : null}
            <span>{sessionStarting ? "Indexing materials..." : "Start Practice"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────────
  if (questionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)] bg-[var(--bg-canvas)]">
        <div className="text-center space-y-3">
          <Loader2 size={20} className="animate-spin text-[var(--accent)] mx-auto" />
          <p className="text-xs text-[var(--text-tertiary)]">Loading next question…</p>
        </div>
      </div>
    );
  }

  // ── MAIN SPLIT LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[var(--bg-canvas)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b-hairline bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[11px] text-[var(--accent)] font-semibold shrink-0">
            {question ? `Module ${question.module_id}` : spaceName}
          </span>
          {question && (
            <>
              <span className="text-[var(--border-strong)] text-xs">/</span>
              <span className="text-xs text-[var(--text-primary)] font-medium truncate">
                {question.concept}
              </span>
              {question.review && (
                <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--status-warning-bg)] text-[var(--status-warning)] text-[10px] font-mono border border-[var(--status-warning-border)] shrink-0">
                  Review
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {question && (
            <div
              className="flex items-center gap-1"
              title={`Difficulty: ${question.difficulty} / 5`}
            >
              {[1, 2, 3, 4, 5].map((dot) => (
                <span
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full ${
                    dot <= question.difficulty
                      ? "bg-[var(--text-primary)]"
                      : "bg-[var(--border-hairline)]"
                  }`}
                />
              ))}
            </div>
          )}
          {status && (
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {status.done}/{status.total} modules
            </span>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline hover:bg-[var(--bg-subtle)] flex items-center gap-1"
            title="Open history (H)"
          >
            <History size={12} />
            <span>History ({allAttempts.length})</span>
          </button>
        </div>
      </div>

      {/* Error / Notice banners */}
      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs flex items-start gap-2 shrink-0"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Error</span>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => handleStartSession(false)}
            className="px-2 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] text-[11px] font-medium shrink-0"
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className="mx-4 mt-2 p-2 rounded-[var(--radius-xs)] border-hairline bg-[var(--status-success-bg)] text-[var(--status-success)] text-xs font-mono shrink-0">
          {notice}
        </div>
      )}

      {/* ── MCQ: Single Focused Question Card (No Text Editor) ── */}
      {question && question.type === "mcq" && (
        <div className="flex-1 min-h-0 overflow-hidden p-3 flex justify-center">
          <div className="w-full max-w-3xl border-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] flex flex-col min-h-0 overflow-hidden shadow-sm">
            {/* Question meta header */}
            <div className="px-5 py-3 border-b-hairline bg-[var(--bg-canvas)]/60 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] font-mono text-[10px] uppercase font-bold tracking-wider">
                  Multiple Choice
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate max-w-[280px]">
                  {question.title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                Diff {question.difficulty}/5
              </span>
            </div>

            {/* Scrollable question body: prompt + choices + hints + feedback */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 space-y-6 select-text">
              {/* Markdown Question Prompt */}
              <div className="space-y-2">
                <MarkdownView
                  content={question.prompt}
                  className="text-sm font-sans leading-relaxed"
                />
              </div>

              {/* MCQ Options */}
              {question.options && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                    Select an option:
                  </div>
                  <fieldset className="space-y-2.5">
                    <legend className="sr-only">Choose an answer</legend>
                    {question.options.map((option, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = mcqChoice === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          disabled={Boolean(result)}
                          onClick={() => setMcqChoice(letter)}
                          className={`w-full flex items-start gap-3.5 p-3.5 text-left text-xs rounded-[var(--radius-md)] border-hairline transition-all ${
                            isSelected
                              ? "bg-[var(--accent-subtle)] border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-sm"
                              : "bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-[var(--radius-xs)] flex items-center justify-center font-mono text-xs font-semibold shrink-0 border-hairline transition-colors ${
                              isSelected
                                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className={`flex-1 leading-relaxed ${isSelected ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}`}>
                            {option}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] pt-0.5">
                            [{idx + 1}]
                          </span>
                        </button>
                      );
                    })}
                  </fieldset>
                </div>
              )}

              {/* Hints */}
              {hints.length > 0 && (
                <div className="space-y-2.5 border-l-2 border-[var(--status-warning)] pl-4 py-1 text-xs text-[var(--text-secondary)] bg-[var(--status-warning-bg)]/40 rounded-r-[var(--radius-sm)]">
                  {hints.map((hint, i) => (
                    <p key={i} className="leading-relaxed">
                      <strong className="text-[var(--text-primary)] font-mono text-[11px] block mb-0.5">
                        Hint {i + 1}
                      </strong>
                      {hint}
                    </p>
                  ))}
                </div>
              )}

              {/* Sources */}
              {question.sources.length > 0 && (
                <div className="border-t-hairline pt-4">
                  <button
                    type="button"
                    onClick={() => setSourcesOpen(!sourcesOpen)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                  >
                    <span>Grounded in {question.sources.length} sources</span>
                    {sourcesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {sourcesOpen && (
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)] pl-4 list-disc">
                      {question.sources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-[var(--accent)] inline-flex items-center gap-1.5"
                          >
                            <span>{src.title}</span>
                            <span className="text-[var(--text-tertiary)]">({src.where})</span>
                            <ExternalLink size={10} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Evaluation Feedback on MCQ Card */}
              {result && (
                <div className="border-t-hairline pt-5 space-y-4">
                  <div className={`p-4 rounded-[var(--radius-md)] border-hairline flex items-center justify-between ${
                    result.score >= 0.7 
                      ? "bg-[var(--status-success-bg)]/60 border-[var(--status-success-border)]" 
                      : "bg-[var(--status-warning-bg)]/60 border-[var(--status-warning-border)]"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        result.score >= 0.7 ? "bg-[var(--status-success)] text-white" : "bg-[var(--status-warning)] text-white"
                      }`}>
                        {result.score >= 0.7 ? <Check size={16} /> : <RotateCcw size={16} />}
                      </div>
                      <div>
                        <span className="font-serif text-sm font-medium text-[var(--text-primary)] capitalize block">
                          {result.verdict}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                          Score: {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-surface)] text-[var(--accent)] border-hairline shadow-2xs">
                      +{result.xp} XP
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                      Explanation
                    </span>
                    <MarkdownView content={result.feedback} className="text-xs" />
                  </div>

                  {result.model_answer && (
                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-canvas)] text-xs space-y-2">
                      <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-bold tracking-wider">
                        Reference Explanation
                      </span>
                      <MarkdownView content={result.model_answer} className="text-xs font-sans" />
                    </div>
                  )}

                  {completedModuleEvent && completedModuleTitle && (
                    <div className="pt-2">
                      <ModuleCompleteDialog
                        moduleTitle={completedModuleTitle}
                        event={completedModuleEvent}
                        spaceId={spaceId}
                        onContinueModule={handleContinueModule}
                        onNextModule={loadQuestion}
                        onPreferenceSaved={handlePreferenceSaved}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-5 py-3 border-t-hairline bg-[var(--bg-canvas)]/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {!result && (
                  <>
                    <button
                      type="button"
                      onClick={handleAskHint}
                      disabled={isHintLoading || hints.length >= question.hints_available}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
                    >
                      {isHintLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Lightbulb size={13} />
                      )}
                      <span>Hint ({Math.max(0, question.hints_available - hints.length)} left)</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                        aria-label="More actions"
                        className="p-1.5 rounded-[var(--radius-sm)] border-hairline text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {moreMenuOpen && (
                        <div className="absolute left-0 bottom-full mb-1 w-44 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] p-1 text-xs shadow-md z-20">
                          <button
                            type="button"
                            onClick={loadQuestion}
                            className="w-full text-left px-3 py-2 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Skip question
                          </button>
                          <button
                            type="button"
                            onClick={handleSkipModule}
                            className="w-full text-left px-3 py-2 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Skip module
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Submit or Next Question */}
              <div>
                {!result ? (
                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={isSubmitting || !mcqChoice}
                    className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                    <span>{isSubmitting ? "Evaluating…" : "Submit"}</span>
                    <kbd className="font-mono text-[10px] text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
                      ⌘↵
                    </kbd>
                  </button>
                ) : completedModuleEvent ? null : (
                  <button
                    type="button"
                    onClick={loadQuestion}
                    className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-all shadow-sm"
                  >
                    <span>Next question</span>
                    <ArrowRight size={13} />
                    <kbd className="font-mono text-[10px] text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
                      ↵
                    </kbd>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NON-MCQ: Split Pane with Left Question & Right Code/Text Editor ── */}
      {question && question.type !== "mcq" && (
        <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden p-3 select-none">
          {/* ── LEFT PANEL: Question Card (Fills remaining workspace) ──── */}
          <div
            className="flex-1 min-w-[320px] min-h-0 border-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] flex flex-col overflow-hidden shadow-sm"
          >
            {/* Question meta */}
            <div className="px-5 py-3 border-b-hairline bg-[var(--bg-canvas)]/60 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] font-mono text-[10px] uppercase font-bold tracking-wider">
                  {questionTypeLabel}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate max-w-[200px]">
                  {question.title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                Diff {question.difficulty}/5
              </span>
            </div>

            {/* Scrollable question body (strictly constrained to this panel frame) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 space-y-6 select-text">
              <div className="space-y-2">
                <MarkdownView
                  content={question.prompt}
                  className="text-sm font-sans leading-relaxed"
                />
              </div>

              {/* Hints */}
              {hints.length > 0 && (
                <div className="space-y-2.5 border-l-2 border-[var(--status-warning)] pl-4 py-1 text-xs text-[var(--text-secondary)] bg-[var(--status-warning-bg)]/40 rounded-r-[var(--radius-sm)]">
                  {hints.map((hint, i) => (
                    <p key={i} className="leading-relaxed">
                      <strong className="text-[var(--text-primary)] font-mono text-[11px] block mb-0.5">
                        Hint {i + 1}
                      </strong>
                      {hint}
                    </p>
                  ))}
                </div>
              )}

              {/* Sources */}
              {question.sources.length > 0 && (
                <div className="border-t-hairline pt-4">
                  <button
                    type="button"
                    onClick={() => setSourcesOpen(!sourcesOpen)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                  >
                    <span>Grounded in {question.sources.length} sources</span>
                    {sourcesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {sourcesOpen && (
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)] pl-4 list-disc">
                      {question.sources.map((src, i) => (
                        <li key={i}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-[var(--accent)] inline-flex items-center gap-1.5"
                          >
                            <span>{src.title}</span>
                            <span className="text-[var(--text-tertiary)]">({src.where})</span>
                            <ExternalLink size={10} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Left panel bottom: Hint + More actions */}
            {!result && (
              <div className="px-5 py-3 border-t-hairline bg-[var(--bg-canvas)]/50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={handleAskHint}
                  disabled={isHintLoading || hints.length >= question.hints_available}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
                >
                  {isHintLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Lightbulb size={13} />
                  )}
                  <span>Hint ({Math.max(0, question.hints_available - hints.length)} left)</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    aria-label="More actions"
                    className="p-1.5 rounded-[var(--radius-sm)] border-hairline text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-1 w-44 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] p-1 text-xs shadow-md z-20">
                      <button
                        type="button"
                        onClick={loadQuestion}
                        className="w-full text-left px-3 py-2 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Skip question
                      </button>
                      <button
                        type="button"
                        onClick={handleSkipModule}
                        className="w-full text-left px-3 py-2 rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Skip module
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── DRAGGABLE DIVIDER RESIZER ─────────────────────────────── */}
          <div
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              startXRef.current = e.clientX;
              startWidthRef.current = rightPanelWidth;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="w-3 flex items-center justify-center cursor-col-resize group shrink-0 relative hover:bg-[var(--accent-subtle)]/40 rounded transition-colors"
            title="Drag to resize right answer box"
          >
            <div className="w-1 h-8 rounded-full bg-[var(--border-hairline)] group-hover:bg-[var(--accent)] transition-colors" />
          </div>

          {/* ── RIGHT PANEL: Answer Card (Independently sized) ─────────── */}
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="border-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] flex flex-col min-h-0 overflow-hidden shadow-sm shrink-0"
          >
            {/* Answer area header */}
            <div className="px-5 py-3 border-b-hairline bg-[var(--bg-canvas)]/60 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {question.type === "code" ? (
                  <Code size={13} className="text-[var(--accent)]" />
                ) : (
                  <FileText size={13} className="text-[var(--accent)]" />
                )}
                <span className="text-[11px] font-mono text-[var(--text-primary)] uppercase tracking-wider font-semibold">
                  {question.type === "code" ? (question.code?.language ? `Solution (${question.code.language})` : "Solution") : "Your Answer"}
                </span>
                {!result && (
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded">
                    {answer.split("\n").length} lines · {answer.length} chars
                  </span>
                )}
              </div>

              {/* Action buttons on header */}
              {!result && (
                <div className="flex items-center gap-2">
                  {answer && (
                    <button
                      type="button"
                      onClick={() => setAnswer("")}
                      className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-tertiary)] hover:text-[var(--status-danger)] hover:bg-[var(--bg-subtle)] transition-colors"
                      title="Clear answer"
                    >
                      <Trash2 size={11} />
                      <span>Clear</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.py,.js,.ts,.java,.c,.cpp,.cs,.go,.rs,.rb,.php,.swift,.kt,.r,.sql,.sh,.yaml,.yml,.json,.xml,.csv,.tex"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors shadow-2xs"
                    title="Upload file — content will be inserted"
                  >
                    <Upload size={12} />
                    <span>Upload file</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable answer body */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-surface)]">
              {!result ? (
                <>
                  {/* Code editor with line numbers */}
                  {question.type === "code" && (
                    <div className="flex-1 flex overflow-hidden bg-[var(--bg-canvas)] font-mono text-xs">
                      {/* Line numbers gutter */}
                      <div className="py-4 pl-3 pr-2 select-none text-[11px] font-mono text-[var(--text-tertiary)] text-right bg-[var(--bg-surface)]/40 border-r-hairline min-w-[36px] overflow-hidden">
                        {(answer || " ").split("\n").map((_, i) => (
                          <div key={i} className="leading-5 h-5">{i + 1}</div>
                        ))}
                      </div>

                      {/* Code textarea */}
                      <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="# Write your solution here...&#10;def solution():&#10;    pass"
                        className="flex-1 p-4 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none resize-none leading-5 font-mono text-xs overflow-y-auto"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                      />
                    </div>
                  )}

                  {/* Freeform text / short answer editor — LeetCode Clean Full-Canvas Style */}
                  {question.type !== "code" && (
                    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] overflow-hidden">
                      <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your explanation, formula, or response here... (Markdown supported)"
                        className="flex-1 w-full p-6 bg-transparent text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none resize-none overflow-y-auto font-sans"
                        spellCheck={true}
                      />
                    </div>
                  )}
                </>
              ) : (
                /* ── FEEDBACK replaces answer area ── */
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5">
                  {/* Verdict badge line */}
                  <div className={`p-4 rounded-[var(--radius-md)] border-hairline flex items-center justify-between ${
                    result.score >= 0.7 
                      ? "bg-[var(--status-success-bg)]/60 border-[var(--status-success-border)]" 
                      : "bg-[var(--status-warning-bg)]/60 border-[var(--status-warning-border)]"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        result.score >= 0.7 ? "bg-[var(--status-success)] text-white" : "bg-[var(--status-warning)] text-white"
                      }`}>
                        {result.score >= 0.7 ? <Check size={16} /> : <RotateCcw size={16} />}
                      </div>
                      <div>
                        <span className="font-serif text-sm font-medium text-[var(--text-primary)] capitalize block">
                          {result.verdict}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                          Score: {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-xs)] bg-[var(--bg-surface)] text-[var(--accent)] border-hairline shadow-2xs">
                      +{result.xp} XP
                    </span>
                  </div>

                  {/* Feedback text */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                      Evaluation
                    </span>
                    <MarkdownView content={result.feedback} className="text-xs" />
                  </div>

                  {/* Model answer */}
                  {result.model_answer && (
                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-canvas)] text-xs space-y-2">
                      <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-bold tracking-wider">
                        Reference Answer
                      </span>
                      <MarkdownView content={result.model_answer} className="text-xs font-sans" />
                    </div>
                  )}

                  {/* Test failures */}
                  {result.tests && result.tests.failures.length > 0 && (
                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--status-danger-bg)] text-xs font-mono space-y-2">
                      <span className="text-[var(--status-danger)] font-semibold text-[11px] block">
                        Failed Assertions ({result.tests.failures.length}):
                      </span>
                      {result.tests.failures.map((f, i) => (
                        <div key={i} className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2 rounded border-hairline">
                          args: {JSON.stringify(f.args)} · expected{" "}
                          {JSON.stringify(f.expected)} · got {JSON.stringify(f.got)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review sources */}
                  {result.review_sources && result.review_sources.length > 0 && (
                    <div className="text-xs space-y-2 pt-2 border-t-hairline">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] block">
                        Review these sources:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {result.review_sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-canvas)] hover:border-[var(--accent)] text-[11px] text-[var(--accent)] font-medium transition-colors"
                          >
                            <span>{src.title}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Module Complete Box */}
                  {completedModuleEvent && completedModuleTitle && (
                    <div className="pt-2">
                      <ModuleCompleteDialog
                        moduleTitle={completedModuleTitle}
                        event={completedModuleEvent}
                        spaceId={spaceId}
                        onContinueModule={handleContinueModule}
                        onNextModule={loadQuestion}
                        onPreferenceSaved={handlePreferenceSaved}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right panel bottom: Submit / Next */}
            <div className="px-5 py-3 border-t-hairline bg-[var(--bg-canvas)]/50 flex items-center justify-end shrink-0">
              {!result ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={isSubmitting || !answer.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                  <span>{isSubmitting ? "Evaluating…" : "Submit"}</span>
                  <kbd className="font-mono text-[10px] text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
                    ⌘↵
                  </kbd>
                </button>
              ) : completedModuleEvent ? null : (
                <button
                  type="button"
                  onClick={loadQuestion}
                  className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-all shadow-sm"
                >
                  <span>Next question</span>
                  <ArrowRight size={13} />
                  <kbd className="font-mono text-[10px] text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
                    ↵
                  </kbd>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Slide-over Drawer */}
      {historyOpen && (
        <div
          role="dialog"
          aria-label="Practice attempts history"
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setHistoryOpen(false)}
        >
          <aside
            className="w-full max-w-sm h-full bg-[var(--bg-surface)] border-l-hairline p-5 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-hairline mb-4">
              <div>
                <h3 className="font-serif text-base font-normal text-[var(--text-primary)]">
                  Attempts
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {allAttempts.length} responses in this space
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="p-1 rounded-[var(--radius-xs)] border-hairline hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 text-xs">
              {(["all", "solved", "review"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-[var(--radius-xs)] font-mono text-[11px] capitalize border-hairline transition-colors ${
                    historyFilter === f
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)] font-medium"
                      : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <p className="p-4 text-center text-xs text-[var(--text-tertiary)]">
                  No attempts recorded yet.
                </p>
              ) : (
                filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setSelectedHistoryEntry(
                        selectedHistoryEntry?.id === item.id ? null : item,
                      )
                    }
                    className="w-full p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-left hover:border-[var(--border-strong)] transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[var(--text-tertiary)]">
                        Mod {item.module_id}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)] ${
                          item.score >= 0.7
                            ? "text-[var(--status-success)] bg-[var(--status-success-bg)]"
                            : "text-[var(--status-warning)] bg-[var(--status-warning-bg)]"
                        }`}
                      >
                        {Math.round(item.score * 100)}%
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">
                      {item.concept || item.question}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)] font-mono">
                      {new Date(item.timestamp).toLocaleDateString()} · {item.type}
                    </p>
                    {selectedHistoryEntry?.id === item.id && (
                      <div className="mt-2 pt-2 border-t-hairline space-y-1.5">
                        <p className="text-[11px] font-serif text-[var(--text-primary)]">
                          {item.question}
                        </p>
                        <div className="p-2 rounded bg-[var(--bg-subtle)] text-[11px] text-[var(--text-secondary)]">
                          <strong>Answer: </strong>
                          {item.answer || "Skipped."}
                        </div>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
