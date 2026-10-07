export default function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading content" className="grid gap-4">
      <div className="loading-skeleton" />
      <div className="loading-skeleton" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
