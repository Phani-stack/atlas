import { useState } from "react";
import {
  Compass,
  Home,
  Layers,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export type NavItem = "home" | "space" | "review" | "settings";

interface GlobalNavProps {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  spaces: { id: string; name: string; status: "ready" | "building" | "failed" }[];
  activeSpaceId: string | null;
  onSelectSpace: (id: string) => void;
  onNewSpace: () => void;
  reviewCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  userEmail: string;
  onSignOut: () => void;
  onOpenCommandPalette?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function GlobalNav({
  activeNav,
  onNavigate,
  spaces,
  activeSpaceId,
  onSelectSpace,
  onNewSpace,
  reviewCount,
  theme,
  onToggleTheme,
  userEmail,
  onSignOut,
  isCollapsed = false,
  onToggleCollapse,
}: GlobalNavProps) {
  const [spacesOpen, setSpacesOpen] = useState(true);

  return (
    <>
      {/* Desktop Left Rail (Collapsed: 56px, Expanded: 210px) */}
      <aside
        aria-label="Sidebar Navigation"
        className={`hidden md:flex shrink-0 min-h-screen border-r-hairline bg-[var(--bg-canvas)] flex-col justify-between p-2 select-none transition-all duration-200 ${
          isCollapsed ? "w-[56px]" : "w-[210px]"
        }`}
      >
        <div>
          {/* Header & Collapse toggle */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-1.5 py-2.5 mb-3`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center text-[var(--accent)] font-serif italic font-bold text-base">
                  A
                </span>
                <span className="font-serif text-sm font-medium tracking-tight text-[var(--text-primary)]">
                  Atlas
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={isCollapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-xs)]"
                >
                  {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                </button>
              )}
            </div>
          </div>

          {/* Primary Nav List */}
          <nav className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              aria-current={activeNav === "home" ? "page" : undefined}
              title={isCollapsed ? "Home" : undefined}
              className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5"} rounded-[var(--radius-sm)] transition-colors ${
                activeNav === "home"
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Home size={15} className={activeNav === "home" ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
              {!isCollapsed && <span>Home</span>}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("review")}
              aria-current={activeNav === "review" ? "page" : undefined}
              title={isCollapsed ? `Review (${reviewCount})` : undefined}
              className={`w-full flex items-center ${isCollapsed ? "justify-center p-2 relative" : "justify-between px-2.5 py-1.5"} rounded-[var(--radius-sm)] transition-colors ${
                activeNav === "review"
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={15} className={activeNav === "review" ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
                {!isCollapsed && <span>Review</span>}
              </div>
              {reviewCount > 0 && (
                isCollapsed ? (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
                ) : (
                  <span className="px-1.5 py-0.2 rounded-[var(--radius-xs)] bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] text-[10px] font-mono">
                    {reviewCount}
                  </span>
                )
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("settings")}
              aria-current={activeNav === "settings" ? "page" : undefined}
              title={isCollapsed ? "Settings" : undefined}
              className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5"} rounded-[var(--radius-sm)] transition-colors ${
                activeNav === "settings"
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Settings size={15} className={activeNav === "settings" ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"} />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </nav>

          {/* Spaces Collapsible Group */}
          <div className="mt-4 pt-3 border-t-hairline">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]">
                <button
                  type="button"
                  onClick={() => setSpacesOpen(!spacesOpen)}
                  className="flex items-center gap-1 hover:text-[var(--text-primary)] tracking-wide uppercase font-mono text-[10px]"
                >
                  {spacesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  <span>Spaces</span>
                </button>
                <button
                  type="button"
                  onClick={onNewSpace}
                  title="Create new learning space"
                  className="hover:text-[var(--accent)] p-0.5 rounded-[var(--radius-xs)]"
                >
                  <Plus size={13} />
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={onNewSpace}
                  title="Create new space"
                  className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)]"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {(spacesOpen || isCollapsed) && (
              <div className="mt-1 space-y-0.5">
                {spaces.map((space) => {
                  const isActive = activeNav === "space" && activeSpaceId === space.id;
                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        onSelectSpace(space.id);
                        onNavigate("space");
                      }}
                      title={isCollapsed ? space.name : undefined}
                      className={`w-full flex items-center ${isCollapsed ? "justify-center p-2 relative" : "gap-2 px-2.5 py-1.5"} rounded-[var(--radius-sm)] text-xs text-left transition-colors ${
                        isActive
                          ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          space.status === "ready"
                            ? "bg-[var(--status-success)]"
                            : space.status === "building"
                            ? "bg-[var(--status-warning)] animate-pulse"
                            : "bg-[var(--status-danger)]"
                        }`}
                        title={`Status: ${space.status}`}
                      />
                      {!isCollapsed && <span className="truncate flex-1">{space.name}</span>}
                      {isActive && !isCollapsed && (
                        <span className="w-1 h-3 rounded-full bg-[var(--accent)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Rail Controls */}
        <div className="border-t-hairline pt-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <span className="truncate max-w-[120px] text-[11px] text-[var(--text-tertiary)] font-mono" title={userEmail}>
                {userEmail}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)]"
                >
                  {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--status-danger)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)]"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <button
                type="button"
                onClick={onToggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)]"
              >
                {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out"
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--status-danger)] rounded-[var(--radius-xs)] hover:bg-[var(--bg-subtle)]"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-hairline bg-[var(--bg-surface)] flex items-center justify-around px-2 py-2 text-xs"
      >
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeNav === "home" ? "text-[var(--accent)] font-medium" : "text-[var(--text-secondary)]"
          }`}
        >
          <Home size={17} />
          <span className="text-[10px]">Home</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (spaces[0]) onSelectSpace(spaces[0].id);
            onNavigate("space");
          }}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeNav === "space" ? "text-[var(--accent)] font-medium" : "text-[var(--text-secondary)]"
          }`}
        >
          <Compass size={17} />
          <span className="text-[10px]">Space</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("review")}
          className={`relative flex flex-col items-center gap-1 p-1 ${
            activeNav === "review" ? "text-[var(--accent)] font-medium" : "text-[var(--text-secondary)]"
          }`}
        >
          <Layers size={17} />
          <span className="text-[10px]">Review</span>
          {reviewCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
          )}
        </button>
        <button
          type="button"
          onClick={onNewSpace}
          className="flex flex-col items-center gap-1 p-1 text-[var(--text-secondary)]"
        >
          <Plus size={17} />
          <span className="text-[10px]">New</span>
        </button>
      </nav>
    </>
  );
}
