export function Skeleton({
  className = "",
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  if (lines === 1) {
    return (
      <div
        className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-muted)] h-4 ${className}`}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-muted)] h-4 ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
