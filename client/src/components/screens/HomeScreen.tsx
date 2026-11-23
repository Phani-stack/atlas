import { ArrowRight, Plus } from "lucide-react";
import type { SpaceSummary, LearningSpace, TutorStatus } from "../../types";

interface HomeScreenProps {
  spaces: SpaceSummary[];
  activeSpace: LearningSpace | null;
  tutorStatus: TutorStatus | null;
  onSelectSpace: (id: string, initialTab?: "path" | "practice") => void;
  onNewSpace: () => void;
}

export function HomeScreen({
  spaces,
  activeSpace,
  tutorStatus,
  onSelectSpace,
  onNewSpace,
}: HomeScreenProps) {
  const modulesDone = tutorStatus?.done ?? 0;
  const modulesTotal = tutorStatus?.total ?? (activeSpace?.roadmap?.phases.flatMap((p) => p.modules).length || 1);
  const progressPercent = Math.round((modulesDone / Math.max(1, modulesTotal)) * 100);

  // Active module title
  const activeModule = tutorStatus?.modules.find((m) => m.status === "active")?.title ||
    activeSpace?.roadmap?.phases[0]?.modules[0]?.title ||
    "Select or start a learning space";

  return (
    <div className="bg-[var(--bg-canvas)] py-8 px-4 sm:px-8 max-w-4xl mx-auto space-y-10">
      {/* Editorial Date & Title */}
      <header className="border-b-hairline pb-4 flex items-baseline justify-between">
        <div>
          <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
            Dashboard
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal mt-1">
            Your Learning Spaces
          </h1>
        </div>
        <span className="font-mono text-xs text-[var(--text-tertiary)]">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </header>

      {/* Primary "Continue" Block */}
      {activeSpace && (
        <section aria-labelledby="continue-title" className="p-5 sm:p-6 rounded-[var(--radius-lg)] border-hairline bg-[var(--bg-surface)] space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono">
            <span>Continue · {activeSpace.name}</span>
            <span>{progressPercent}% complete</span>
          </div>

          <div className="space-y-1">
            <h2 id="continue-title" className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-normal">
              {activeModule}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Pick up where you left off.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="w-1/2 h-1 bg-[var(--bg-muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => onSelectSpace(activeSpace.id, "practice")}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
            >
              <span>Continue learning</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      )}

      {/* Recent Spaces (Real backend list) */}
      <section aria-labelledby="spaces-list-title" className="space-y-3">
        <div className="flex items-center justify-between border-b-hairline pb-2">
          <h3 id="spaces-list-title" className="font-serif text-lg text-[var(--text-primary)] font-normal">
            Your Learning Spaces
          </h3>
          <button
            type="button"
            onClick={onNewSpace}
            className="flex items-center gap-1 text-xs font-mono text-[var(--accent)] hover:underline"
          >
            <Plus size={12} />
            <span>New space</span>
          </button>
        </div>

        {spaces.length === 0 ? (
          <div className="p-8 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] text-center space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">No learning spaces created yet.</p>
            <button
              type="button"
              onClick={onNewSpace}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium"
            >
              Create your first space
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-hairline)]">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="py-3 flex items-center justify-between text-xs hover:bg-[var(--bg-subtle)] px-2 rounded-[var(--radius-sm)] transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        space.status === "ready"
                          ? "bg-[var(--status-success)]"
                          : space.status === "building"
                          ? "bg-[var(--status-warning)] animate-pulse"
                          : "bg-[var(--status-danger)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => onSelectSpace(space.id, "path")}
                      className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--accent)] truncate text-left"
                    >
                      {space.name}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate pl-3.5">
                    {space.topic}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-[var(--text-tertiary)] hidden sm:inline">
                    {new Date(space.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSpace(space.id, "path")}
                    className="px-2.5 py-1 rounded-[var(--radius-xs)] border-hairline hover:bg-[var(--bg-surface)] text-[11px] font-medium text-[var(--text-primary)]"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}