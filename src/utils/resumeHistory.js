export const RESUME_HISTORY_LIMIT = 10;
export const RESUME_HISTORY_RETENTION_DAYS = 30;

export function pruneResumeHistory(history, now = Date.now()) {
  if (!Array.isArray(history)) return [];

  const cutoff = now - RESUME_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return history
    .filter((entry) => {
      const savedAt = new Date(entry?.savedAt).getTime();
      return Number.isFinite(savedAt) && savedAt >= cutoff;
    })
    .slice(-RESUME_HISTORY_LIMIT);
}
