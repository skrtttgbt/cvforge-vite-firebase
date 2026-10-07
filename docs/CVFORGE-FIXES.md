CVForge Spark-compatible fixes — October 7, 2026

Implemented and verified locally. No production deployment, production data migration, billing upgrade, or remote backend creation occurred. The previous Functions implementation was local only and has been removed. Firebase requirements are Authentication, the existing default Standard Firestore database, Firestore Security Rules, and existing classic Hosting; the app is React + Vite. No Blaze upgrade is required for these services within Spark quotas. See [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

Removed from the previous fix

- Entire introduced functions/ directory: index.js, package.json, package-lock.json, migrate-sharing.js, and its local installed dependencies. This removes firebase-functions and firebase-admin.
- Introduced src/services/backend.js callable wrapper.
- Functions deployment/emulator configuration in firebase.json and functions/node_modules ignore entry.
- Backend imports and backend-dependent sharing/security tests; Secret Manager and backend migration/deployment instructions.

Refactored files

- src/services/aiService.js and new src/services/groqService.js restore direct Groq requests with openai/gpt-oss-20b. Grounding, one correction request and source-only fallback remain. Existing local .env was preserved; .env.example documents the client key limitation.
- src/services/firestoreService.js and new src/utils/sharing.js create UUID tokens and approved redacted snapshots in Firestore transactions, redeem through client transactions, revoke/delete owner links, and publish UUID public portfolios.
- firestore.rules enforces owner isolation, exact approved snapshot fields, contact preferences, no public lists, expiry/revocation and revision gates, immutable token snapshots, and exact counter increments.
- src/pages/TokenManagement.jsx no longer includes private contact/profile metadata in token requests. src/pages/SharedProfile.jsx avoids double redemption from repeated React effects. src/utils/privacyPolicy.js discloses access counting and copying limits.
- tests/security.mjs, tests/browser.mjs, tests/sharing.test.js, package.json, README.md, docs/security-audit.json and this handoff reflect Spark-only behavior. The token settings screen explains counting limitations.

Follow-up UI/loading fixes

- The root route now displays Login. Registration automatically opens the shared Privacy Policy modal; Terms and Privacy buttons reopen documents without leaving the form. Consent remains unchecked until explicitly selected.
- Firestore document/query reads have a 10-second UI deadline. Failed profile requests leave the cache so Retry can issue a new read; stale failures cannot remove newer cached requests. This ends the UI wait and does not cancel the underlying Firebase operation.
- Auth restoration has a 12-second deadline with a retry state; missing configuration or observer errors no longer leave the auth subscriber waiting indefinitely. Permission errors remain failures rather than empty profiles.
- TopBar uses AuthContext directly, removing its duplicate fetch/subscription and incorrectly cased authService import. Dashboard reports loading failures with Retry rather than displaying misleading empty statistics.
- ProfileAvatar imports src/assets/images/profile.jpg through Vite. Missing or broken photo URLs use the bundled fallback in TopBar and Dashboard; no route-relative asset path is used.
- Profile Management now also uses ProfileAvatar. All three owner views resolve the saved imgUrl, legacy profile photoURL, then sign-in photoURL through the same profilePhoto helper. Dashboard uses the shared AuthContext photo so it stays aligned with TopBar. Browser checks verify the default, broken URL fallback and changed saved image across all three surfaces.
- Build and 21 unit tests pass. Browser checks deliberately block Firestore, verify the loading failure state and retry recovery, and verify missing/broken-photo fallback, alongside the earlier regressions.

Resume editing and approval follow-up

- DraftEditor no longer crashes when array indexes reach the label formatter. Canonical normalization handles string skills and education/profile aliases; empty sections remain editable with Add/Remove controls. Target Role remains canonical/read-only.
- ResumePreview renders normalized names/education fields, including legacy strings and aliases. Fresh generation fills empty skill/education sections only from populated profile facts. Saved exclusions are preserved; public rendering never inserts missing private owner data.
- Approve opens ResumeApproval: one include/skip question at a time for each skill, education/experience/project/certification entry, summary and contact detail. Back changes a decision, Escape/Cancel leaves the draft unapproved, and Confirm approval persists exactly the selected content. Missing items can be offered from the owner's populated profile; invented recommendations are not added.
- Editing remains separate from approval. Saving edits returns to Draft and requires another review. Generate/Approve/Download/Save Draft are gated while editing to avoid overwriting unsaved changes.
- Build and 24 unit tests pass; browser regression covers the reported string-skill crash, section rendering, Add/Remove, sequential review/Back/cancel, persisted exclusions, existing approval/share gates and the earlier mobile/accessibility checks. The icon-only interview history control now has an accessible label.

Earlier fixes preserved

- AI uses populated, deduplicated, section-specific source facts; unsupported claims and inferred graduate/seniority claims are rejected. No new skills, experience, qualifications or metrics are manufactured.
- Profile Management has one canonical target role. Profile saves reset output approval; completion measures eight actual populated areas and lists missing areas.
- Resume and portfolio start Draft; editing resets approval. Download, Publish and Share require approval. Portfolio defaults private, random publication IDs and contacts off; publication requires confirmation.
- Interviews use role-relevant topics, typed answers only and clearly labeled practice feedback. No inferred confidence rating or artificial source-import delay.
- Auth/profile state is cached with save/user-change invalidation; skeletons and stable loading remain.
- Privacy disclosures cover Groq/model, Firebase, Cloudinary, actual sharing/retention/deletion limits and qualified RA 10173 principles.
- Mobile Resume Builder overflow fixes, Escape/focus restoration, titles, skip link, public home and real 404 remain. Employer/HR has no account, candidate list, candidate modification permission or private profile access.
- On-demand PDF bundle loading remains.

Firestore schema and rules

Existing private collections remain owner-only: profiles/{uid}, users/{uid}, profileSources/{uid}, resumeDrafts/{uid}, webPortfolioDrafts/{uid}, interviewSessions/{id}. The existing (default) Standard database in asia-southeast1 is unchanged.

| Path | Spark-compatible data/access |
| --- | --- |
| profiles/{uid} | Canonical targetRole; uid/userId bound to authenticated owner. |
| resumeDrafts/{uid} | Owner-only reviewed draft, status draft/approved, updatedAt revision. |
| webPortfolioDrafts/{uid} | Owner-only draft/config, private default, contact opt-ins, UUID publicSlug, approvedSharedSources captured at approval, updatedAt revision. |
| tokens/{UUID} | schemaVersion=2, token/tokenValue/sharedResourceId=UUID, ownerId, active/status, expiresAt/createdAt/updatedAt timestamps, viewCount, maxViews (0 unlimited), allowDownload, accessType, hasResume/hasPortfolio and selected source revision timestamps. No candidate contact/profile data. Owner query or exact valid bearer-ID read only. |
| tokenShares/{UUID} | schemaVersion=2, ownerId, token, sharedResume/sharedPortfolio (unselected null), sharedSources. Only exact approved filtered fields; no raw provider response or private profile. Owner or valid token bearer get; no list; immutable after creation. |
| publicPortfolios/{UUID} | schemaVersion=2, ownerId, approved/public status, filtered draft, empty publicProfile, approved publicSources, sourceUpdatedAt/updatedAt. Anonymous get requires live approved public owner source with matching slug/revision; no list. |

Token metadata and snapshot are created atomically. Rules compare the shared fields directly with the selected approved owner drafts and contact flags. Public reads check request.time for expiry, active/status for revocation, remaining count and current source approval/revision. Rules inspect private sources internally; recipients cannot read those source documents. Browser validation also checks token format/state before redemption. Firestore transaction retries serialize normal concurrent app redemptions.

Existing data / release procedure

1. Review the rules and audit. Release the Spark frontend and matching rules together using existing classic Hosting and Firestore only. No Functions deployment or secret setup is part of this release.
2. Existing private data is preserved. Legacy tokens/public snapshots without schemaVersion=2 fail closed for anonymous access. Their owners can still list/revoke/delete old tokens.
3. Owners review current outputs, save/approve them, reissue new tokens and explicitly republish portfolios. This creates filtered schemaVersion=2 snapshots. Old bearer links must be replaced; no admin migration, broad public read or silent republishing is used.
4. Rules must be deployed before relying on the new authorization behavior. Local verification does not claim that the live application already has these changes.

Verification completed

- npm run build succeeds without the functions directory. Vite still reports large chunks (~1 MB main and ~936 KB lazy PDF); no runtime Firebase server is required.
- npm test: 18 passing tests for profile validation, grounding, role topics, redaction and token state.
- Firestore emulator: ownership, direct public isolation, atomic approved shares (resume-only and combined), extra/private fields denied, list denial, forged updates denied, concurrent one-view redemption, expiry, revocation, exhausted links, approval/revision invalidation and public publishing/redaction. Browser checks also cover portfolio-only sharing and direct shared-page redemption.
- Local headless Chrome: all four mobile widths, approval/edit gates, canonical role, privacy/titles/404, Escape/focus, skip link, contact defaults, anonymous token access/exhaustion/revision invalidation and public portfolio redaction. Test data uses demo-cvforge only.
- npm ls firebase-functions firebase-admin --all returns empty; src/config has no Functions import, callable route or deployment dependency. The general Firebase client SDK lock includes its optional @firebase/functions module transitively; this app never imports or requires that module/service.
- Rules compile and run in the emulator. No real Groq request or live deployment/provider integration was exercised; deterministic mocks verify grounding and UI without spending provider credits.

Security limitations without a backend

- VITE_GROQ_API_KEY is exposed to browser users/build output. The original direct integration remains operational with the existing key configuration. Hiding a secret key securely requires a backend or proxy outside this Spark-only Firebase architecture; no such backend was invented or deployed. Browser validation cannot prevent someone with the key from making independent AI requests.
- A token bearer can read a permitted snapshot directly without incrementing viewCount. The app increments transactionally, and rules block access once the stored counter is exhausted, but cannot require that every Firestore read has a corresponding write. Strict read quotas require a trusted redemption gateway outside this architecture. A bearer can also consume counts without viewing, so this counter is not unique-viewer analytics.
- allowDownload governs the app action only. Recipients can copy, screenshot or print delivered content; revocation cannot erase delivered copies, cached navigation state or printed files.
- Bearer metadata exposes ownerId, permission and revision/expiry fields to someone already holding a valid unguessable link. OwnerId does not grant access to the private collections. Links must be treated as credentials; public portfolio links are deliberately readable by anyone who receives them.
- Flexible private nested content is not bounded at every leaf by rules; Firestore document limits and owner authorization apply. No trusted server schema sanitization or centralized AI rate limiting exists. Spark quotas can cause service unavailability when exhausted; billing remains unchanged.
- Source URLs are saved, not independently imported/verified. Grounding is conservative and may reject unverifiable paraphrases. Complete account/provider-asset deletion and automatic retention remain unimplemented and are disclosed in policy.

Manual acceptance tests

Each expected result below is implemented. Live provider/deployment checks remain pending; local evidence is described above.

| Criterion | Manual action and expected result |
| --- | --- |
| Empty profile cannot invent skills/experience | Generate with empty skill/experience sections: both stay empty; verify unit test for a wholly empty profile too. |
| Recent graduate supported only | Remove graduation years and submit that generated phrase: it is rejected; add an explicit recent graduation year and source summary: only then may it appear. |
| Unsupported claims removed | Inject/observe a fabricated technology, employer or metric: one correction request; persistent unsupported output is removed with the warning. |
| Grounded prompts | Inspect the direct Groq request using a test account: no empty labels, inferred seniority, private contact fields or unrelated owner metadata. |
| Private new portfolio | Generate/save a new portfolio: visibility remains private and unauthenticated access fails. |
| Random portfolio URL | Approve and publish: URL is `/p/{UUID}`, never a name. |
| Publication confirmation | Click Make Public: Cancel leaves it private; Make Public publishes only after approval. |
| Contact opt-in | Keep all contact checkboxes off, publish/redeem, and inspect response: email/phone/address/source contacts absent; opt in and approve again to share selected fields. |
| Draft initial state | Generate either output: Draft badge/state and disabled final actions. |
| Approval before download | Download remains disabled until Approve; editing and saving disables it again. |
| Approval before publish | Make Public disabled for Draft; Firestore rules reject an unapproved document even if a request is crafted. |
| Approval before tokens | Select Resume Only, Portfolio Only, or both: token creation rejects any selected unapproved/missing output. |
| Draft save allowed | Save Draft before Approve: storage succeeds; final actions remain gated. |
| Role-relevant questions | Use Frontend Developer and Data Analyst in turn: topics change; unrelated React/CSS questions for Data Analyst are rejected. |
| Text-only interview | Enter typed answers: no microphone, speech, video or facial controls exist. |
| Practice indicator | View feedback: visible note says it is not an official employer/HR assessment; no fake scores when provider unavailable. |
| Completion populated fields | Add placeholders, invalid URLs, partial rows and malformed dates: they do not complete areas; valid entries update the eight-area count and missing list. |
| Canonical target role | Change role in Profile: dashboard, builder, portfolio, interview and saved outputs use it; saved output approval resets. |
| No artificial wait | Navigate while signed in: no intentional one-second auth delay; source actions no longer simulate import waits. |
| One auth observer | Inspect `onAuthChange`: one underlying Auth observer fans out to subscribers across routes. |
| Cached profile | Navigate between modules: profile reads share the cache; a save/account change invalidates it. |
| Stable loading | With network throttling, skeleton layout appears and controls wait for data; no mandatory cosmetic loader delay. |
| Groq disclosure | `/privacy` and sign-in privacy dialog name Groq API. |
| Model disclosure | Both name `openai/gpt-oss-20b`. |
| Cloudinary disclosure | Both explain image processing/storage and that removing a reference does not delete the asset. |
| Firebase disclosure | Both identify Authentication and Firestore. |
| RA 10173 | Both use consideration-of-principles wording and describe access/correction, purposes and choices. |
| No false guarantees | Search policy: no fully-compliant guarantee, unsupported automatic retention or complete deletion promise. |
| Mobile overflow | At 320/375/390/414px, load long unbroken resume text and toolbars: document width does not exceed viewport. |
| Escape dialogs | Open privacy/history: Escape closes; profile setup Escape asks before sign-out/data loss. SweetAlert dialogs retain built-in Escape behavior. |
| Focus restoration/close | Close privacy/history by Escape/button: trigger regains focus. Required setup offers sign-out confirmation. |
| Page titles | Navigate every registered route and unknown path: meaningful `… | CVForge` title. |
| Skip link | Press Tab from page start: link becomes visible; activate it to focus `main-content`. |
| Real 404/public home | Visit an unknown URL or `/employer`: see 404, then Return Home opens the public home. |
| No HR account flow | Registration offers job-seeker access only; no employer dashboard/candidate list route exists. |
| Public token access | Sign out, enter/redeem a valid token: only selected approved snapshot(s) appear. |
| Cannot browse applicants | Public token/portfolio collection queries fail; private source drafts are denied; the app returns only shared snapshots (narrow token metadata contains ownerId). |
| Invalid/expired/revoked denial | Test each token state independently: denied; maxViews=1 under concurrent requests permits only one. |
| Download permission | allowDownload=false hides the application download action; true permits printing/downloading the approved shared snapshot. |
| URL/text safety | Try `javascript:`, `data:` and invalid URLs; no clickable unsafe URL. Pasted `<script>` remains text. AI is never rendered as HTML. |
| Owner security | Use a second account/direct SDK: another owner's profile, sources, drafts and sessions are denied; tokens can be read only with a valid bearer ID or the owner query. |
