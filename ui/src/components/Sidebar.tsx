import { ArrowUpRight, BookOpenCheck, CircleHelp, Compass, LogOut, Plus, Sparkles, Target } from "lucide-react";
import type { SpaceSummary } from "../types";

export type WorkspacePage = "discover" | "practice" | "progress";

type SidebarProps = {
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
  spaces: SpaceSummary[];
  activeSpaceId: string | null;
  email: string;
  onSelectSpace: (spaceId: string) => void;
  onNewSpace: () => void;
  onLogout: () => void;
};

const navigation: { id: WorkspacePage; label: string; icon: typeof Compass }[] = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "practice", label: "Practice", icon: Target },
  { id: "progress", label: "Progress", icon: BookOpenCheck },
];

export function Sidebar({
  activePage,
  onNavigate,
  spaces,
  activeSpaceId,
  email,
  onSelectSpace,
  onNewSpace,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white px-5 py-4 lg:min-h-screen lg:w-[250px] lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
      <button type="button" onClick={() => onNavigate("discover")} className="flex items-center gap-3 self-start text-left">
        <span className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <Compass size={21} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-[15px] font-bold tracking-tight text-slate-900">Resource Atlas</span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-slate-400">YOUR LEARNING COMPASS</span>
        </span>
      </button>

      <div className="mt-4 lg:mt-9">
        <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:block">Workspace</p>
        <nav aria-label="Workspace navigation" className="flex gap-1 overflow-x-auto lg:flex-col">
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition lg:gap-3 lg:py-3 lg:text-sm ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-700"
                }`}
              >
                <Icon size={17} />
                {label}
                {active ? <span className="ml-auto hidden size-1.5 rounded-full bg-indigo-500 lg:block" /> : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 min-w-0 lg:mt-8">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Learning spaces</p>
          <button
            type="button"
            onClick={onNewSpace}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <Plus size={13} /> New
          </button>
        </div>
        {spaces.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-h-64 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => onSelectSpace(space.id)}
                aria-pressed={activeSpaceId === space.id}
                className={`min-w-[180px] rounded-xl border p-2.5 text-left transition lg:min-w-0 ${
                  activeSpaceId === space.id
                    ? "border-indigo-200 bg-indigo-50/70"
                    : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <span className="block truncate text-xs font-semibold text-slate-800">{space.name}</span>
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] text-slate-400">{space.topic}</span>
                  <span className={`size-1.5 shrink-0 rounded-full ${
                    space.status === "ready" ? "bg-emerald-500" :
                      space.status === "building" ? "bg-amber-500" : "bg-rose-500"
                  }`} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 py-2 text-[10px] leading-4 text-slate-400">Create a space for each learning goal.</p>
        )}
      </div>

      <div className="mt-8 hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles size={15} className="text-amber-500" />
          Your learning flow
        </div>
        <ol className="mt-4 space-y-4">
          {["Set your goal", "Gather trusted resources", "Practice and review"].map((item, index) => (
            <li key={item} className="flex items-center gap-3 text-xs text-slate-500">
              <span className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-indigo-600 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 lg:mt-auto">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-700">{email}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Private account</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="mt-4 hidden items-center justify-between text-[10px] text-slate-400 lg:flex">
        <span className="inline-flex items-center gap-1"><CircleHelp size={12} /> Private learning spaces</span>
        <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-indigo-600">
          FastAPI <ArrowUpRight size={12} />
        </a>
      </div>
    </aside>
  );
}
