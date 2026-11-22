import { useState, useEffect } from "react";
import { Check, ArrowRight, Layers, BookOpen } from "lucide-react";
import type { ReviewCard } from "../../data/sampleData";

interface ReviewScreenProps {
  cards: ReviewCard[];
  onComplete?: () => void;
  onNavigateToHome?: () => void;
}

export function ReviewScreen({
  cards,
  onComplete,
  onNavigateToHome,
}: ReviewScreenProps) {
  const [queue] = useState<ReviewCard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);

  const currentCard = queue[currentIndex];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in text inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" && !isRevealed && currentCard) {
        e.preventDefault();
        setIsRevealed(true);
        return;
      }

      if (isRevealed && currentCard) {
        if (e.key === "1") handleRate("again");
        if (e.key === "2") handleRate("hard");
        if (e.key === "3") handleRate("good");
        if (e.key === "4") handleRate("easy");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, currentCard, currentIndex]);

  function handleRate(_rating: "again" | "hard" | "good" | "easy") {
    setIsRevealed(false);
    setCompletedToday((prev) => prev + 1);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Queue completed
      if (onComplete) onComplete();
      setCurrentIndex(queue.length);
    }
  }

  // Queue finished screen
  if (!currentCard || currentIndex >= queue.length) {
    return (
      <div className="bg-[var(--bg-canvas)] py-16 px-4 max-w-lg mx-auto text-center space-y-5">
        <div className="w-12 h-12 rounded-full border-hairline bg-[var(--bg-surface)] text-[var(--status-success)] flex items-center justify-center mx-auto">
          <Check size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-[var(--text-primary)] font-normal">
            Review Queue Cleared
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            You reviewed {completedToday} spaced repetition concepts today across all learning spaces.
            Retention schedule updated.
          </p>
        </div>
        <div className="pt-4">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors"
          >
            <span>Return to field overview</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-canvas)] py-8 px-4 sm:px-8 max-w-2xl mx-auto space-y-6">
      {/* Top Header & Session Progress */}
      <header className="border-b-hairline pb-4 flex items-baseline justify-between text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-tertiary)]">
          <Layers size={13} className="text-[var(--accent)]" />
          <span>Card {currentIndex + 1} of {queue.length}</span>
          <span>·</span>
          <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">
            {currentCard.spaceName}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          Repetition #{currentCard.repetition}
        </span>
      </header>

      {/* Main Flashcard Container (Clean, unboxed editorial design) */}
      <article aria-labelledby="card-concept" className="p-6 sm:p-8 rounded-[var(--radius-lg)] border-hairline bg-[var(--bg-surface)] space-y-6 min-h-[320px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
            <span id="card-concept" className="uppercase tracking-wider font-semibold text-[var(--accent)]">
              {currentCard.concept}
            </span>
            <span>Space interval: {currentCard.intervalDays}d</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] leading-relaxed font-normal">
            {currentCard.prompt}
          </h3>
        </div>

        {/* Revealed Answer vs Reveal Button */}
        {isRevealed ? (
          <div className="border-t-hairline pt-5 space-y-4">
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)] font-semibold block">
                Field Explanation & Key Takeaway
              </span>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {currentCard.answer}
              </p>
            </div>

            {currentCard.sourceReference && (
              <p className="text-[11px] text-[var(--text-tertiary)] font-mono flex items-center gap-1.5 pt-2">
                <BookOpen size={11} /> Source: {currentCard.sourceReference}
              </p>
            )}

            {/* Rating Buttons (1 to 4) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
              <button
                type="button"
                onClick={() => handleRate("again")}
                className="p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-danger-bg)] text-[var(--status-danger)] hover:opacity-85 text-xs text-center transition-colors"
              >
                <span className="block font-medium">Again</span>
                <span className="font-mono text-[10px] opacity-75">&lt; 10m · [1]</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate("hard")}
                className="p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-warning-bg)] text-[var(--status-warning)] hover:opacity-85 text-xs text-center transition-colors"
              >
                <span className="block font-medium">Hard</span>
                <span className="font-mono text-[10px] opacity-75">1d · [2]</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate("good")}
                className="p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--accent-subtle)] text-[var(--accent)] hover:opacity-85 text-xs text-center transition-colors"
              >
                <span className="block font-medium">Good</span>
                <span className="font-mono text-[10px] opacity-75">3d · [3]</span>
              </button>

              <button
                type="button"
                onClick={() => handleRate("easy")}
                className="p-2.5 rounded-[var(--radius-sm)] border-hairline bg-[var(--status-success-bg)] text-[var(--status-success)] hover:opacity-85 text-xs text-center transition-colors"
              >
                <span className="block font-medium">Easy</span>
                <span className="font-mono text-[10px] opacity-75">7d · [4]</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-6 border-t-hairline text-center">
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-primary)] font-medium transition-colors"
            >
              <span>Show answer</span>
              <kbd className="font-mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border-hairline">
                Space
              </kbd>
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
