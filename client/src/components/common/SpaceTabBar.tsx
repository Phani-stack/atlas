import { Compass, BookOpen, Target, BarChart2 } from "lucide-react";

export type SpaceTab = "path" | "library" | "practice" | "stats";

interface SpaceTabBarProps {
  activeTab: SpaceTab;
  onTabChange: (tab: SpaceTab) => void;
  spaceName: string;
  topic: string;
  status: "ready" | "building" | "failed";
  compact?: boolean;
}

export function SpaceTabBar({
  activeTab,
  onTabChange,
  spaceName,
  topic,
  status,
  compact = false,
}: SpaceTabBarProps) {
  const tabs: { id: SpaceTab; label: string; icon: typeof Compass }[] = [
    { id: "path", label: "Path", icon: Compass },
    { id: "library", label: "Library", icon: BookOpen },
    { id: "practice", label: "Practice", icon: Target },
    { id: "stats", label: "Stats", icon: BarChart2 },
  ];

  if (compact) {
    return (
      <header className="border-b-hairline bg-[var(--bg-canvas)] sticky top-0 z-30 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "ready"
                  ? "bg-[var(--status-success)]"
                  : status === "building"
                  ? "bg-[var(--status-warning)] animate-pulse"
                  : "bg-[var(--status-danger)]"
              }`}
              title={`Status: ${status}`}
            />
            <span className="font-serif text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">
              {spaceName}
            </span>
          </div>

          {/* Compact Tabs */}
          <nav aria-label="Space tabs" className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[var(--radius-xs)] transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--bg-subtle)] text-[var(--accent)] font-medium border-hairline shadow-2xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <Icon size={12} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate hidden md:inline">
          {topic}
        </span>
      </header>
    );
  }

  return (
    <header className="border-b-hairline bg-[var(--bg-canvas)] sticky top-0 z-30 px-6 pt-3.5 pb-0">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2.5">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h1 className="font-serif text-lg sm:text-xl font-normal text-[var(--text-primary)] truncate">
            {spaceName}
          </h1>
          {topic !== spaceName && (
            <span className="text-xs text-[var(--text-tertiary)] truncate hidden sm:inline">
              ({topic})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-xs)] border-hairline text-[11px] font-mono ${
              status === "ready"
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]"
                : status === "building"
                ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)] animate-pulse"
                : "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "ready"
                  ? "bg-[var(--status-success)]"
                  : status === "building"
                  ? "bg-[var(--status-warning)]"
                  : "bg-[var(--status-danger)]"
              }`}
            />
            {status === "ready" ? "Active trail" : status === "building" ? "Synthesizing" : "Error"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <nav aria-label="Space tabs" className="flex gap-5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-1.5 py-2 text-xs border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[var(--accent)] text-[var(--text-primary)] font-medium"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              }`}
            >
              <Icon size={13} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
