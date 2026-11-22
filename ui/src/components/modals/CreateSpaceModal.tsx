import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { createLearningSpace } from "../../lib/api";
import type { LearningSpace } from "../../types";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (createdSpace: LearningSpace) => void;
  onBackgrounded: (spaceName: string) => void;
}

export function CreateSpaceModal({
  isOpen,
  onClose,
  onCreated,
  onBackgrounded,
}: CreateSpaceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Topic, 2: Prior Knowledge + Goal, 3: Generation

  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [known, setKnown] = useState("");
  const [goal, setGoal] = useState("");
  const [wantDiagnostic, setWantDiagnostic] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    { title: "Querying Academic Repositories & Web", desc: "Finding papers, RFCs, textbooks, and documentation" },
    { title: "Downloading & Extracting Materials", desc: "Caching local PDFs and lecture materials" },
    { title: "Synthesizing Phased Roadmap", desc: "Planning structured modules, checkpoints, and capstone" },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTopic("");
      setName("");
      setKnown("");
      setGoal("");
      setWantDiagnostic(false);
      setIsGenerating(false);
      setGenerationError("");
      setStageIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 3 && isGenerating) {
      const interval = setInterval(() => {
        setStageIndex((prev) => (prev + 1) % stages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [step, isGenerating, stages.length]);

  async function handleStartGeneration() {
    setStep(3);
    setIsGenerating(true);
    setGenerationError("");

    try {
      const created = await createLearningSpace({
        name: name.trim() || undefined,
        topic: topic.trim(),
        known: known.trim(),
        goal: goal.trim(),
        hours_per_week: 7, // sensible default, hidden from the user
      });

      setIsGenerating(false);
      onCreated(created);
      onClose();
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(
        err instanceof Error ? err.message : "Unable to generate space. Check backend server.",
      );
    }
  }

  const stepSubtitle =
    step === 3
      ? "Connecting to backend resource finder & roadmap generator."
      : `Step ${step} of 2 · Custom cartography`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 3 && isGenerating ? () => onBackgrounded(name || topic) : onClose}
      title={step === 3 ? "Synthesizing Learning Space" : "New Learning Space"}
      subtitle={stepSubtitle}
      maxWidth="max-w-md"
    >
      {/* ── STEP 1: TOPIC & SPACE NAME ─────────────────────────── */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) setStep(2);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="topic-input" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              What topic do you wish to explore? <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              id="topic-input"
              type="text"
              required
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Consensus, Computer Networks…"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)]"
            />
          </div>

          <div>
            <label htmlFor="name-input" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Space Title <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Defaults to topic name"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-40"
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: PRIOR KNOWLEDGE + GOAL ────────────────────── */}
      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleStartGeneration();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="known-input" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              What do you already understand about this topic?
            </label>
            <textarea
              id="known-input"
              rows={3}
              value={known}
              onChange={(e) => setKnown(e.target.value)}
              placeholder="e.g. Familiar with basic Python and OS processes, but new to transport layer mechanics…"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] resize-none"
            />
          </div>

          <div>
            <label htmlFor="goal-input" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              What is your primary goal? <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <textarea
              id="goal-input"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Build and benchmark a userspace reliable transport protocol…"
              className="w-full p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-focus)] resize-none"
            />
          </div>

          {/* Diagnostic Quiz Offer */}
          <div className="p-3 rounded-[var(--radius-sm)] border-hairline bg-[var(--bg-canvas)] flex items-start gap-2.5">
            <HelpCircle size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantDiagnostic}
                  onChange={(e) => setWantDiagnostic(e.target.checked)}
                  className="rounded-[var(--radius-xs)] accent-[var(--accent)]"
                />
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  Calibrate via baseline diagnostic
                </span>
              </label>
              <p className="text-[11px] text-[var(--text-secondary)] leading-normal pl-5">
                Automatically calipers your starting waypoint by assessing fundamental concepts before constructing the route.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t-hairline">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]"
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
            >
              <span>Begin Survey & Synthesis</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: GENERATION STAGES ─────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {generationError ? (
            <div className="p-3.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle size={15} />
                <span>Synthesis Error</span>
              </div>
              <p className="leading-relaxed">{generationError}</p>
              <button
                type="button"
                onClick={handleStartGeneration}
                className="mt-2 px-3 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] font-medium text-xs"
              >
                Retry generation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stages.map((st, i) => {
                const isCurrent = stageIndex === i;
                const isCompleted = stageIndex > i;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border-hairline transition-colors ${
                      isCurrent
                        ? "bg-[var(--bg-canvas)] border-[var(--border-focus)]"
                        : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-[var(--status-success)]" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="text-[var(--accent)] animate-spin" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-hairline inline-block" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium ${
                          isCurrent
                            ? "text-[var(--text-primary)]"
                            : isCompleted
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {st.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-normal">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!generationError && (
            <div className="pt-3 border-t-hairline flex items-center justify-between text-xs">
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Processing on backend · Notification upon completion
              </span>
              <button
                type="button"
                onClick={() => {
                  onBackgrounded(name || topic);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--bg-subtle)] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Leave in background
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
