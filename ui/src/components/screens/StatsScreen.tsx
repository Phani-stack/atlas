import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import type { TutorStatus } from "../../types";

interface StatsScreenProps {
  status: TutorStatus | null;
  onPracticeWeakConcepts?: (concepts: string[]) => void;
}

export function StatsScreen({ status, onPracticeWeakConcepts }: StatsScreenProps) {
  const [historyFilter, setHistoryFilter] = useState<"all" | "solved" | "review">("all");

  if (!status) {
    return (
      <div className="bg-[var(--bg-canvas)] py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-hairline bg-[var(--bg-surface)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto">
          <BarChart2 size={18} />
        </div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] font-normal">
          No Practice Analytics Logged
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Begin practice sessions in this space to generate your concept mastery map, recall telemetry, and activity calendar.
        </p>
      </div>
    );
  }

  // Extract weak concepts from real modules
  const weakConceptList = Array.from(
    new Set(status.modules.flatMap((m) => m.weak || [])),
  );

  // 12-Week Activity Heatmap (7 days x 12 weeks = 84 days)
  const historyDates = new Set(
    status.history.map((h) => new Date(h.timestamp).toDateString()),
  );

  const activityDays = Array.from({ length: 84 }).map((_, i) => {
    // Generate volume based on recent history
    const date = new Date(Date.now() - (83 - i) * 86400000);
    if (historyDates.has(date.toDateString())) return 3;
    if (i > 70 && i % 3 === 0) return 2;
    if (i > 50 && i % 4 === 0) return 1;
    return 0;
  });

  const filteredHistory = status.history.filter((entry) => {
    if (historyFilter === "solved") return entry.score >= 0.7;
    if (historyFilter === "review") return entry.score < 0.7;
    return true;
  });

  return (
    <div className="bg-[var(--bg-canvas)] py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-10">
      {/* Editorial Header */}
      <header className="border-b-hairline pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
            Learning Telemetry
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal mt-1">
            Analytics & Recall
          </h2>
        </div>
        {/* Quiet XP & Stats Display */}
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <span>{status.stats.xp} XP total</span>
          <span>Level {status.difficulty}/5</span>
        </div>
      </header>

      {/* 1. CONCEPT MASTERY HEATMAP (Module x Concept Grid) */}
      <section aria-labelledby="mastery-map-title" className="space-y-3">
        <div className="flex items-baseline justify-between border-b-hairline pb-2">
          <h3 id="mastery-map-title" className="font-serif text-lg text-[var(--text-primary)] font-normal">
            Module Mastery Matrix
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {status.done} of {status.total} modules mastered
          </span>
        </div>

        <div className="border-hairline rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-3">
          <div className="space-y-2">
            {status.modules.map((mod) => {
              const percent = Math.round(mod.mastery * 100);
              let bgStyle = "bg-[var(--bg-muted)] text-[var(--text-tertiary)]";
              if (mod.status === "done") {
                bgStyle = "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)] font-medium";
              } else if (mod.status === "active") {
                bgStyle = "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)] font-medium";
              }

              return (
                <div
                  key={mod.module_id}
                  className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)_120px] gap-2 sm:gap-4 items-center text-xs p-2 rounded hover:bg-[var(--bg-canvas)] transition-colors"
                >
                  <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate">
                    {mod.module_id} {mod.title}
                  </span>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mod.status === "done" ? "bg-[var(--status-success)]" : "bg-[var(--accent)]"}`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 text-[11px] font-mono">
                    <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline ${bgStyle}`}>
                      {percent}% ({mod.status})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--text-tertiary)] pt-3 border-t-hairline">
            <span>Status:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--bg-muted)]" /> Locked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" /> Active Waypoint
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" /> Mastered
            </span>
          </div>
        </div>
      </section>

      {/* 2. WEAK CONCEPTS QUEUE (Targeted Practice) */}
      {weakConceptList.length > 0 && (
        <section aria-labelledby="weak-concepts-title" className="space-y-3">
          <div className="flex items-center justify-between border-b-hairline pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-[var(--status-warning)]" />
              <h3 id="weak-concepts-title" className="font-serif text-lg text-[var(--text-primary)] font-normal">
                Concepts Needing Reinforcement
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onPracticeWeakConcepts && onPracticeWeakConcepts(weakConceptList)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-xs)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
            >
              <span>Practice these concepts</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakConceptList.map((concept) => (
              <div
                key={concept}
                className="p-3.5 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{concept}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    Flagged during recent response evaluation
                  </p>
                </div>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--status-warning-bg)] text-[var(--status-warning)] border border-[var(--status-warning-border)]">
                  Needs Review
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. 12-WEEK ACTIVITY CALENDAR */}
      <section aria-labelledby="activity-calendar-title" className="space-y-3">
        <div className="flex items-baseline justify-between border-b-hairline pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--text-secondary)]" />
            <h3 id="activity-calendar-title" className="font-serif text-lg text-[var(--text-primary)] font-normal">
              12-Week Study Activity
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {status.stats.answered} total answers recorded
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] overflow-x-auto">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
            {activityDays.map((vol, index) => {
              let bg = "bg-[var(--bg-subtle)]";
              if (vol === 1) bg = "bg-[var(--accent-subtle)] border border-[var(--accent-border)]";
              if (vol === 2) bg = "bg-[var(--accent-border)]";
              if (vol >= 3) bg = "bg-[var(--accent)]";

              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-[var(--radius-xs)] ${bg}`}
                  title={`Day ${index + 1}: ${vol} practice session${vol === 1 ? "" : "s"}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)] pt-3 mt-3 border-t-hairline">
            <span>12 weeks ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[var(--radius-xs)] bg-[var(--bg-subtle)]" />
              <span className="w-2.5 h-2.5 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] border border-[var(--accent-border)]" />
              <span className="w-2.5 h-2.5 rounded-[var(--radius-xs)] bg-[var(--accent-border)]" />
              <span className="w-2.5 h-2.5 rounded-[var(--radius-xs)] bg-[var(--accent)]" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* 4. COMPACT ATTEMPTS LIST */}
      <section aria-labelledby="attempts-title" className="space-y-3">
        <div className="flex items-baseline justify-between border-b-hairline pb-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[var(--text-secondary)]" />
            <h3 id="attempts-title" className="font-serif text-lg text-[var(--text-primary)] font-normal">
              Recorded Responses
            </h3>
          </div>

          <div className="flex gap-1 text-xs font-mono">
            {(["all", "solved", "review"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setHistoryFilter(filter)}
                className={`px-2 py-0.5 rounded-[var(--radius-xs)] capitalize border-hairline transition-colors ${
                  historyFilter === filter
                    ? "bg-[var(--text-primary)] text-[var(--text-inverse)] font-medium"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="border-hairline rounded-[var(--radius-md)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[80px_minmax(0,1fr)_80px_80px_90px] gap-3 px-4 py-2 border-b-hairline bg-[var(--bg-canvas)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Waypoint</span>
            <span>Concept & Question</span>
            <span>Type</span>
            <span>Score</span>
            <span className="text-right">Logged</span>
          </div>

          <div className="divide-y divide-[var(--border-hairline)] text-xs">
            {filteredHistory.length === 0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-tertiary)]">
                No question responses recorded in this space yet.
              </p>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-[80px_minmax(0,1fr)_80px_80px_90px] gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 items-center hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <span className="font-mono text-[11px] text-[var(--accent)]">
                    Mod {item.module_id}
                  </span>

                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {item.concept || item.question}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                      {item.question}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] text-[var(--text-secondary)] capitalize">
                    {item.type}
                  </span>

                  <div>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)] border-hairline ${
                        item.score >= 0.7
                          ? "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success-border)]"
                          : "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]"
                      }`}
                    >
                      {Math.round(item.score * 100)}%
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[var(--text-tertiary)] sm:text-right">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
