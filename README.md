# CVForge — Vite + React + Firebase Ready Prototype

This project is a Vite React implementation of the CVForge UI based on the provided capstone screens. It includes the ICT Job Seeker dashboard, profile management, source input, AI-assisted resume builder, web portfolio generator, interview preparation, token management, employer token access, and shared profile viewer.

## Features included

- Vite + React single-page application
- Spark-compatible Firebase Authentication, Firestore, Security Rules, and classic Hosting
- Job seeker authentication screens: sign up and login
- Employer / HR token access and viewing screens
- Profile Management UI with tabbed sections
- Profile Source Input UI for LinkedIn, Indeed, GitHub, GitLab, Coursera, Udemy, HireVue, and Glassdoor
- AI Resume Builder with resume preview
- Web Portfolio Generator with live portfolio preview
- Interview Preparation workspace with AI feedback panel
- Token Management with UUID generation, approved redacted snapshots, revocation, and owner-only token table
- Firestore owner isolation and token/portfolio sharing rules
- Direct Groq integration with grounded drafts and explicit approval
- Mock/demo mode when Firebase `.env` values are not yet configured

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```bash
http://localhost:5173
```

## Firebase setup

1. Use the existing Firebase project and keep its Spark plan. Do not enable Blaze or paid Firebase server products.
2. Enable Authentication, then enable Email/Password, Google, and Microsoft providers if needed.
3. Enable Cloud Firestore.
4. Copy `.env.example` to `.env`.
5. Paste your Firebase web app config values into `.env`.
6. Restart the Vite dev server.

Example:

```bash
cp .env.example .env
npm run dev
```

## Deploy to Firebase Hosting

```bash
npm run build
firebase login
firebase deploy --only firestore:rules,hosting
```

The included `firebase.json` already points hosting to the `dist` folder and rewrites all routes to `index.html`.

## Groq AI integration and security limitation

The existing integration calls Groq directly from the browser using:

```bash
VITE_AI_PROVIDER=groq
VITE_AI_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
VITE_GROQ_API_KEY=your_key
```

The fixed model is `openai/gpt-oss-20b`. Vite exposes the API key to browser users. Hiding a secret securely requires a separate backend/proxy outside this Spark-only Firebase architecture. No Firebase Functions, Cloud Run, App Hosting functions or paid Extensions are used. Set `VITE_AI_PROVIDER=mock` for local factual drafts without provider requests; this does not manufacture interview scores.

## Important files

```text
src/main.jsx                  Main React app and pages
src/styles/styles.css          CVForge UI styling
src/services/firebase.js       Firebase initialization
src/services/firestoreService.js Firestore helpers
src/services/aiService.js      Grounded AI generation and role-specific interview feedback
src/services/groqService.js    Direct Groq requests (client key is public)
src/data/sampleData.js         Demo candidate data
firestore.rules                Owner isolation and approved snapshot/token rules
firebase.json                  Firebase Hosting config
.env.example                   Environment variable template
```

## Notes

See [the fix handoff](docs/CVFORGE-FIXES.md) for schema, legacy-link reissue steps, acceptance checks and security limitations. Token expiry/revocation and approved source revisions are enforced in Firestore rules. Access counting is transactional in the app, but recipients can bypass counting through permitted direct reads until the counter is exhausted. Download flags cannot prevent copying or browser printing. No billing upgrade is required; Spark quotas still apply.
