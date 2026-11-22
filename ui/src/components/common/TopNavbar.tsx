import { useState, useRef, useEffect } from "react";
import {
  Compass,
  BookOpen,
  Target,
  BarChart2,
  Plus,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import type { SpaceSummary, LearningSpace } from "../../types";

export type ViewTab = "path" | "library" | "practice" | "stats" | "home" | "settings";

interface TopNavbarProps {
  spaces: SpaceSummary[];
  activeSpace: LearningSpace | null;
  onSelectSpace: (spaceId: string) => void;
  onNewSpace: () => void;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  userEmail: string;
  onSignOut: () => void;
}

export function TopNavbar({
  spaces,
  activeSpace,
  onSelectSpace,
  onNewSpace,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  userEmail,
  onSignOut,
}: TopNavbarProps) {
  const [spacesDropdownOpen, setSpacesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSpacesDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs: { id: ViewTab; label: string; icon: typeof Compass }[] = [
    { id: "path", label: "Path", icon: Compass },
    { id: "practice", label: "Practice", icon: Target },
    { id: "library", label: "Library", icon: BookOpen },
    { id: "stats", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <header className="h-12 border-b-hairline bg-[var(--bg-canvas)] flex items-center justify-between px-4 sm:px-6 select-none shrink-0 z-40 sticky top-0 backdrop-blur-md">
      {/* ── LEFT: Brand Logo & Spaces Dropdown ─────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity group"
          title="Home"
        >
          <span className="w-6 h-6 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent)] font-serif italic font-bold text-sm">
            A
          </span>
          <span className="font-serif text-sm font-medium tracking-tight text-[var(--text-primary)] hidden sm:inline">
            Atlas
          </span>
        </button>

        <span className="text-[var(--border-strong)] text-xs hidden sm:inline">/</span>

        {/* Space Selector Dropdown */}
        <div ref={dropdownRef} className="relative min-w-0">
          <button
            type="button"
            onClick={() => setSpacesDropdownOpen(!spacesDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors max-w-[200px] sm:max-w-[260px] truncate shadow-2xs"
          >
            {activeSpace ? (
              <>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activeSpace.status === "ready"
                      ? "bg-[var(--status-success)]"
                      : activeSpace.status === "building"
                      ? "bg-[var(--status-warning)] animate-pulse"
                      : "bg-[var(--status-danger)]"
                  }`}
                />
                <span className="truncate">{activeSpace.name}</span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">Select a Space</span>
            )}
            <ChevronDown size={12} className="text-[var(--text-tertiary)] shrink-0 ml-1" />
          </button>

          {spacesDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] p-1 text-xs shadow-lg z-50 divide-y divide-[var(--border-hairline)]">
              <div className="max-h-56 overflow-y-auto space-y-0.5 p-0.5">
                {spaces.length === 0 ? (
                  <p className="p-3 text-center text-[11px] text-[var(--text-tertiary)]">
                    No spaces created yet
                  </p>
                ) : (
                  spaces.map((space) => {
                    const isSelected = activeSpace?.id === space.id;
                    return (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => {
                          onSelectSpace(space.id);
                          setSpacesDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-xs)] text-left transition-colors ${
                          isSelected
                            ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              space.status === "ready"
                                ? "bg-[var(--status-success)]"
                                : space.status === "building"
                                ? "bg-[var(--status-warning)] animate-pulse"
                                : "bg-[var(--status-danger)]"
                            }`}
                          />
                          <span className="truncate">{space.name}</span>
                        </div>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onNewSpace();
                    setSpacesDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-xs)] text-left text-[11px] font-mono text-[var(--accent)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <Plus size={13} />
                  <span>Create new space</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: Primary Nav Tabs (Visible when space is active) ────── */}
      {activeSpace && (
        <nav aria-label="Main Navigation" className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-xs)] text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--bg-subtle)] text-[var(--accent)] font-medium border-hairline shadow-2xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── RIGHT: Theme Toggle & User Menu ───────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          className="p-1.5 rounded-[var(--radius-xs)] border-hairline hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] border-hairline bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-2xs"
          >
            <span className="font-mono text-[11px] truncate max-w-[120px] sm:max-w-[150px]">
              {userEmail.split("@")[0]}
            </span>
            <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] p-1 text-xs shadow-lg z-50 divide-y divide-[var(--border-hairline)]">
              <div className="px-3 py-2 text-[11px] font-mono text-[var(--text-tertiary)] truncate">
                {userEmail}
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("settings");
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-xs)] transition-colors"
                >
                  <Settings size={13} />
                  <span>Settings</span>
                </button>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] rounded-[var(--radius-xs)] transition-colors"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
