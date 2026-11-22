import { useEffect, useState, useRef } from "react";
import {
  Compass,
  Folder,
  BookOpen,
  Target,
  BarChart2,
  Moon,
  Sun,
  Plus,
  Home,
  Layers,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  section: "Spaces" | "Views" | "Actions";
  icon: typeof Compass;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: { id: string; name: string }[];
  onSelectSpace: (id: string) => void;
  onNavigateView: (view: "home" | "path" | "library" | "practice" | "stats" | "review") => void;
  onNewSpace: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  spaces,
  onSelectSpace,
  onNavigateView,
  onNewSpace,
  theme,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Views
    {
      id: "view-home",
      title: "Home",
      subtitle: "Overview, resume study, review due",
      section: "Views",
      icon: Home,
      onSelect: () => onNavigateView("home"),
    },
    {
      id: "view-path",
      title: "Path (Roadmap)",
      subtitle: "Vertical trail & waypoints",
      section: "Views",
      icon: Compass,
      onSelect: () => onNavigateView("path"),
    },
    {
      id: "view-practice",
      title: "Practice",
      subtitle: "Adaptive RAG tutor & code assertions",
      section: "Views",
      icon: Target,
      onSelect: () => onNavigateView("practice"),
    },
    {
      id: "view-library",
      title: "Library",
      subtitle: "Dense reading list, papers, and notes",
      section: "Views",
      icon: BookOpen,
      onSelect: () => onNavigateView("library"),
    },
    {
      id: "view-stats",
      title: "Stats & Mastery",
      subtitle: "Mastery map, heatmap & weak concepts",
      section: "Views",
      icon: BarChart2,
      onSelect: () => onNavigateView("stats"),
    },
    {
      id: "view-review",
      title: "Spaced Repetition Review",
      subtitle: "Daily review queue across all spaces",
      section: "Views",
      icon: Layers,
      onSelect: () => onNavigateView("review"),
    },
    // Actions
    {
      id: "action-new-space",
      title: "Create Learning Space...",
      subtitle: "Open the 3-step creation wizard",
      section: "Actions",
      icon: Plus,
      onSelect: onNewSpace,
    },
    {
      id: "action-toggle-theme",
      title: theme === "light" ? "Switch to Dark Theme" : "Switch to Light Theme",
      subtitle: theme === "light" ? "Warm charcoal palette" : "Warm paper palette",
      section: "Actions",
      icon: theme === "light" ? Moon : Sun,
      onSelect: onToggleTheme,
    },
    // Spaces
    ...spaces.map((space) => ({
      id: `space-${space.id}`,
      title: space.name,
      subtitle: "Switch active learning space",
      section: "Spaces" as const,
      icon: Folder,
      onSelect: () => onSelectSpace(space.id),
    })),
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (event.key === "Enter" && filteredItems[selectedIndex]) {
        event.preventDefault();
        filteredItems[selectedIndex].onSelect();
        onClose();
      } else if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[var(--radius-lg)] border-hairline bg-[var(--bg-surface)] text-[var(--text-primary)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b-hairline bg-[var(--bg-canvas)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search spaces..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          <kbd className="text-[10px] text-[var(--text-tertiary)] border-hairline px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {filteredItems.length === 0 ? (
            <p className="p-4 text-xs text-center text-[var(--text-tertiary)]">No matching results.</p>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-[var(--radius-sm)] text-xs transition-colors ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  <Icon
                    size={14}
                    className={isSelected ? "text-white" : "text-[var(--text-secondary)]"}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{item.title}</span>
                    {item.subtitle && (
                      <span
                        className={`text-[11px] truncate block ${
                          isSelected ? "text-white/80" : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      isSelected ? "text-white/70" : "text-[var(--text-tertiary)]"
                    }`}
                  >
                    {item.section}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
