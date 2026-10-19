import test from "node:test";
import assert from "node:assert/strict";
import {
  pruneResumeHistory,
  RESUME_HISTORY_LIMIT,
} from "../src/utils/resumeHistory.js";

test("resume history removes entries older than 30 days", () => {
  const now = Date.parse("2026-10-19T00:00:00.000Z");
  const history = [
    { id: "old", savedAt: "2026-09-18T23:59:59.000Z" },
    { id: "kept", savedAt: "2026-09-19T00:00:00.000Z" },
  ];

  assert.deepEqual(pruneResumeHistory(history, now).map((item) => item.id), [
    "kept",
  ]);
});

test("resume history keeps only the configured number of newest valid entries", () => {
  const now = Date.parse("2026-10-19T00:00:00.000Z");
  const history = Array.from({ length: 120 }, (_, index) => ({
    id: String(index),
    savedAt: new Date(now - (119 - index) * 60_000).toISOString(),
  }));

  const result = pruneResumeHistory(history, now);
  assert.equal(result.length, RESUME_HISTORY_LIMIT);
  assert.equal(result[0].id, String(120 - RESUME_HISTORY_LIMIT));
  assert.equal(result.at(-1).id, "119");
});
