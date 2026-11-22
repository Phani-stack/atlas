import { useState, useEffect, useCallback } from "react";
import { ToastProvider, useToast } from "./components/common/ToastContext";
import { TopNavbar, type ViewTab } from "./components/common/TopNavbar";
import { CreateSpaceModal } from "./components/modals/CreateSpaceModal";
import { Skeleton } from "./components/common/Skeleton";

// Screens
import { HomeScreen } from "./components/screens/HomeScreen";
import { PracticeScreen } from "./components/screens/PracticeScreen";
import { PathScreen } from "./components/screens/PathScreen";
import { LibraryScreen } from "./components/screens/LibraryScreen";
import { StatsScreen } from "./components/screens/StatsScreen";
import { AuthScreen } from "./components/screens/AuthScreen";

// Backend API
import {
  getAccessToken,
  setAccessToken,
  getCurrentUser,
  listLearningSpaces,
  getLearningSpace,
  getSpaceTutorProgress,
} from "./lib/api";
import type {
  AuthResponse,
  AuthUser,
  LearningSpace,
  SpaceSummary,
  TutorStatus,
} from "./types";

// Fallback preview data (only when user clicks preview or offline demo)
import { sampleLearningSpace } from "./data/sampleData";

function AppContent() {
  const { toast } = useToast();

  // Authentication State
  const [token, setToken] = useState<string | null>(getAccessToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getAccessToken()));

  // Navigation State
  const [activeTab, setActiveTab] = useState<ViewTab>("path");

  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("atlas-theme") as "light" | "dark") || "light";
  });

  // Spaces & Active Space State
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [activeSpace, setActiveSpace] = useState<LearningSpace | null>(null);
  const [tutorStatus, setTutorStatus] = useState<TutorStatus | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("atlas-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
    setSpaces([]);
    setActiveSpace(null);
    setTutorStatus(null);
    setActiveTab("home");
  }, []);

  // Listen for 401 unauthorized event
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("resource-atlas:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("resource-atlas:unauthorized", handleUnauthorized);
  }, [clearSession]);

  // Select a space and load its full details + tutor progress from backend
  const selectSpace = useCallback(async (spaceId: string, initialTab: ViewTab = "path") => {
    setSpaceLoading(true);
    setError("");
    setActiveTab(initialTab);

    try {
      // Fetch full space from backend
      const space = await getLearningSpace(spaceId);
      setActiveSpace(space);

      if (space.status === "ready") {
        try {
          const progressRes = await getSpaceTutorProgress(spaceId);
          setTutorStatus(progressRes.status);
        } catch {
          // Progress can be uninitialized until first practice question
          setTutorStatus(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load space details from server.");
    } finally {
      setSpaceLoading(false);
    }
  }, []);

  // Restore authenticated session and load spaces
  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    if (token === "demo-preview") {
      setUser({ id: "demo-user", email: "preview@atlas.local" });
      setSpaces([
        {
          id: sampleLearningSpace.id,
          name: sampleLearningSpace.name,
          topic: sampleLearningSpace.topic,
          status: "ready",
          created_at: sampleLearningSpace.created_at,
          updated_at: sampleLearningSpace.updated_at,
        },
      ]);
      setActiveSpace(sampleLearningSpace);
      setAuthLoading(false);
      return;
    }

    let isMounted = true;
    async function restoreSession() {
      setAuthLoading(true);
      try {
        const [profile, spacesRes] = await Promise.all([
          getCurrentUser(),
          listLearningSpaces(),
        ]);
        if (!isMounted) return;

        setUser(profile);
        setSpaces(spacesRes.spaces);

        if (spacesRes.spaces.length > 0) {
          const firstReady = spacesRes.spaces.find((s) => s.status === "ready") || spacesRes.spaces[0];
          await selectSpace(firstReady.id);
        } else {
          setActiveTab("home");
        }
      } catch {
        if (isMounted) clearSession();
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, [token, selectSpace, clearSession]);

  function handleAuthenticated(response: AuthResponse) {
    setAccessToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    toast({
      title: "Authenticated",
      description: `Welcome back, ${response.user.email}`,
      type: "success",
    });
  }

  function handleSpaceCreated(createdSpace: LearningSpace) {
    setSpaces((prev) => [
      createdSpace,
      ...prev.filter((s) => s.id !== createdSpace.id),
    ]);
    setActiveSpace(createdSpace);
    setActiveTab("path");

    toast({
      title: "Learning Space Created",
      description: `Roadmap and resources ready for "${createdSpace.name}".`,
      type: "success",
    });
  }

  function handleSpaceBackgrounded(spaceName: string) {
    toast({
      title: "Synthesizing in Background",
      description: `Searching and indexing materials for "${spaceName}".`,
      type: "info",
    });
  }

  // Not authenticated view: Direct to Sign In / Sign Up
  if (!token) {
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        onContinueAsGuest={() => {
          setToken("demo-preview");
        }}
      />
    );
  }

  // Initial Auth Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-4">
        <div className="space-y-3 text-center">
          <span className="font-serif italic font-bold text-xl text-[var(--accent)] block">
            A
          </span>
          <p className="text-xs font-mono text-[var(--text-tertiary)]">
            Loading field archives from backend...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col antialiased selection:bg-[var(--accent-subtle)] selection:text-[var(--accent)]">
      {/* Single Top Navigation Bar */}
      <TopNavbar
        spaces={spaces}
        activeSpace={activeSpace}
        onSelectSpace={(id) => selectSpace(id, "path")}
        onNewSpace={() => setCreateModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        userEmail={user?.email || "researcher@atlas.local"}
        onSignOut={clearSession}
      />

      {/* Main Workspace */}
      <div className={`flex-1 min-w-0 flex flex-col ${activeTab === "practice" && activeSpace ? "h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] min-h-0 overflow-hidden" : ""}`}>
        <main className={`flex-1 min-w-0 ${activeTab === "practice" && activeSpace ? "overflow-hidden flex flex-col h-full min-h-0" : ""}`}>
          {error && (
            <div className="max-w-4xl mx-auto mt-4 px-4 sm:px-8">
              <div
                role="alert"
                className="p-3.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs font-mono"
              >
                {error}
              </div>
            </div>
          )}

          {spaceLoading && activeTab !== "home" && activeTab !== "settings" ? (
            <div className="max-w-4xl mx-auto py-12 px-6 space-y-4">
              <Skeleton lines={4} />
            </div>
          ) : (
            <>
              {activeTab === "home" && (
                <HomeScreen
                  spaces={spaces}
                  activeSpace={activeSpace}
                  tutorStatus={tutorStatus}
                  onSelectSpace={(id, tab) => selectSpace(id, tab || "path")}
                  onNewSpace={() => setCreateModalOpen(true)}
                />
              )}

              {activeTab === "settings" && (
                <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
                  <header className="border-b-hairline pb-4">
                    <span className="font-mono text-[11px] text-[var(--accent)] tracking-wider uppercase font-semibold">
                      Preferences
                    </span>
                    <h1 className="font-serif text-2xl text-[var(--text-primary)] font-normal mt-1">
                      Installation Settings
                    </h1>
                  </header>

                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">Interface Palette</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                          Toggle between Warm Paper (#F5F2EA) and Warm Charcoal (#171613).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--bg-subtle)] font-mono text-[11px]"
                      >
                        {theme === "light" ? "Use Dark Palette" : "Use Light Palette"}
                      </button>
                    </div>

                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] space-y-2">
                      <p className="font-medium text-[var(--text-primary)]">Backend Server & Database</p>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        FastAPI backend listening at <code className="font-mono text-[10px] bg-[var(--bg-canvas)] px-1 py-0.5 rounded border-hairline">http://127.0.0.1:8000</code>.
                        SQLite database located at <code className="font-mono text-[10px] bg-[var(--bg-canvas)] px-1 py-0.5 rounded border-hairline">tutor_data/resource_atlas.sqlite3</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-surface)] flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">Signed in as</p>
                        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">{user?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearSession}
                        className="px-3 py-1.5 rounded-[var(--radius-sm)] border-hairline hover:bg-[var(--status-danger-bg)] text-[var(--status-danger)] font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== "home" && activeTab !== "settings" && activeSpace && (
                <>
                  {activeTab === "path" && (
                    <PathScreen
                      roadmap={activeSpace.roadmap}
                      onNavigateToPractice={() => {
                        setActiveTab("practice");
                      }}
                    />
                  )}

                  {activeTab === "practice" && (
                    <PracticeScreen
                      spaceId={activeSpace.id}
                      spaceName={activeSpace.name}
                      topic={activeSpace.topic}
                      initialStatus={tutorStatus}
                      onStatusChange={setTutorStatus}
                    />
                  )}

                  {activeTab === "library" && (
                    <LibraryScreen
                      resources={activeSpace.resources?.resources || []}
                    />
                  )}

                  {activeTab === "stats" && (
                    <StatsScreen
                      status={tutorStatus}
                      onPracticeWeakConcepts={(concepts) => {
                        setActiveTab("practice");
                        toast({
                          title: "Targeted Practice Loaded",
                          description: `Prioritizing ${concepts.join(", ")}.`,
                          type: "info",
                        });
                      }}
                    />
                  )}
                </>
              )}

              {activeTab !== "home" && activeTab !== "settings" && !activeSpace && (
                <HomeScreen
                  spaces={spaces}
                  activeSpace={activeSpace}
                  tutorStatus={tutorStatus}
                  onSelectSpace={(id, tab) => selectSpace(id, tab || "path")}
                  onNewSpace={() => setCreateModalOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3-Step Space Creation Modal */}
      <CreateSpaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleSpaceCreated}
        onBackgrounded={handleSpaceBackgrounded}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
