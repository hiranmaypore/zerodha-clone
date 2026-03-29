/**
 * Reusable Skeleton shimmer components for loading states.
 * Replace spinners with these for a premium feel.
 */

export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`${width} ${height} bg-surface rounded animate-pulse ${className}`} />
  );
}

export function SkeletonCircle({ size = 'w-10 h-10', className = '' }) {
  return (
    <div className={`${size} bg-surface rounded-full animate-pulse ${className}`} />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-card border border-edge rounded-2xl p-5 space-y-3 animate-pulse ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-surface rounded w-1/3" />
          <div className="h-2 bg-surface rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-surface rounded w-full" />
      <div className="h-4 bg-surface rounded w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-card border border-edge rounded-2xl overflow-hidden animate-pulse ${className}`}>
      <div className="px-5 py-3 border-b border-edge">
        <div className="h-4 bg-surface rounded w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-edge/50">
          <div className="w-8 h-8 bg-surface rounded-full" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <div key={j} className="flex-1 h-3 bg-surface rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-edge rounded-xl p-3 space-y-2">
            <div className="h-2 bg-surface rounded w-1/2" />
            <div className="h-4 bg-surface rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="h-[400px] bg-card border border-edge rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-edge rounded-xl p-4 space-y-2">
            <div className="h-3 bg-surface rounded w-1/3" />
            <div className="h-6 bg-surface rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage({ type = 'list' }) {
  if (type === 'cards') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-6 w-48 bg-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-edge rounded-2xl p-6 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-2 bg-surface rounded w-1/3" />
                <div className="w-5 h-5 bg-surface rounded" />
              </div>
              <div className="h-8 bg-surface rounded w-1/2" />
              <div className="h-2 bg-surface rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-edge rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-surface rounded w-1/4" />
          <div className="h-48 bg-surface rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 bg-surface rounded animate-pulse" />
        <div className="h-8 w-32 bg-surface rounded animate-pulse" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
