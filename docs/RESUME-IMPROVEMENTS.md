Resume improvement flow — October 7, 2026

Generate Resume prepares recommendations first. ResumeImprovements displays the skill disclaimer before any skill choices, then asks one question at a time. Every suggestion starts pending with addToProfile=false. Approve/Decline controls resume inclusion; the checkbox controls optional profile persistence. Edited summary/project/experience wording must still be explicitly approved.

After questions, Generate Resume Draft uses only approved suggestions. If profile changes were selected, a separate Add AI Suggestions to Profile? summary appears first. Cancel saves nothing. Save to Profile atomically updates selected fields, then generates the draft. Use in resume only bypasses profile saving while retaining all resume approvals. The preview stays Draft until the existing final resume approval finishes; editing resets approval.

Changed/added files: src/pages/ResumeBuilder.jsx, src/components/ResumeImprovements.jsx, src/services/resumeSuggestionsService.js, src/services/resumeProfileSuggestions.js, src/utils/resumeSuggestions.js, tests/resumeSuggestions.test.js, tests/resumeImprovements.browser.mjs and package.json. No unrelated page or Firebase architecture was changed.

Safeguards

- Skill recommendations are unverified until approved. Pending/declined skill names never enter the final generation profile or profile writes. Resume-only approvals remain in the current resume, not in the saved profile or later profile-based recommendation requests.
- Groq requests for recommendations receive only cleaned owner facts and indexed existing records. Final generation receives an in-memory profile augmented only by approved choices; suggestion status/checkbox metadata is not treated as qualifications.
- Summary suggestions can improve grammar and phrasing while a conservative check preserves ordered substantive words, known equivalents, negations, technologies and numbers. Unsupported rewrites use a clearly labeled profile-based wording template. The question displays the original summary alongside the suggestion. This check can still reject valid paraphrases; users can edit and explicitly approve their own wording. Description suggestions retain the existing source-wording restriction.
- With AI unavailable, the UI explicitly labels recommendations as role-based and wording as profile-sourced. It does not claim that a mock response came from AI.
- Saved skills use the existing skillName/category/proficiencyLevel schema. Names are trimmed, whitespace normalized and compared case-insensitively. AI supplies an editable suggested category from the existing category list; local/legacy recommendations use a role-based fallback. The user chooses proficiency; AI never infers it. Optional source/userConfirmed fields were not added.
- Summary writes check the reviewed baseline. Project/experience writes check the exact original record at the reviewed index, update only description and never create records. Concurrently changed records fail with a message to review the latest profile. Unselected fields are preserved.
- Profile updates invalidate existing resume/portfolio approval atomically. The current visible draft also returns to Draft immediately after a confirmed profile save, including if later generation fails.
- New certifications are not generated or inferred. Existing supplied certification facts continue through normal draft generation/editing/final approval; no unsupported credential recommendations are stored.

Verification: npm run build succeeds; 30 unit tests pass. The dedicated emulator/browser test covers separate resume/profile decisions, declined checkbox safety, suggested summary wording, editable summary/descriptions, confirmation cancellation/no writes, deduplication policy, atomic profile updates, preserved record identity and unrelated fields, final approval and reload. Groq provider calls were not exercised against real credentials; deterministic local recommendation/mock paths and pure response validation were tested.

Firebase remains Spark-compatible: Authentication, Firestore, Security Rules and existing classic Hosting only. No Functions, Admin SDK, Cloud Run or billing-required services were added. The pre-existing exposed Vite Groq-key and client token-count limitations remain documented in CVFORGE-FIXES.md.
