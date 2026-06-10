# CVForge — Vite + React + Firebase Ready Prototype

This project is a Vite React implementation of the CVForge UI based on the provided capstone screens. It includes the ICT Job Seeker dashboard, profile management, source input, AI-assisted resume builder, web portfolio generator, interview preparation, token management, employer token access, and shared profile viewer.

## Features included

- Vite + React single-page application
- Firebase-ready setup for Authentication, Firestore, Storage, and Hosting
- Job seeker authentication screens: sign up and login
- Employer / HR token access and viewing screens
- Profile Management UI with tabbed sections
- Profile Source Input UI for LinkedIn, Indeed, GitHub, GitLab, Coursera, Udemy, HireVue, and Glassdoor
- AI Resume Builder with resume preview
- Web Portfolio Generator with live portfolio preview
- Interview Preparation workspace with AI feedback panel
- Token Management with generation, copy-link UI, revocation placeholder, and recent token table
- Firestore security rules starter file
- AI endpoint placeholder for DeepSeek/OpenAI-compatible backend
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

1. Create a Firebase project.
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
firebase init hosting
firebase deploy
```

The included `firebase.json` already points hosting to the `dist` folder and rewrites all routes to `index.html`.

## DeepSeek / OpenAI-compatible AI integration

For security, do not put your AI API key directly inside Vite frontend code. Create a Firebase Cloud Function or any backend API, then put its endpoint in:

```bash
VITE_AI_ENDPOINT=https://your-cloud-function-url/generate
```

When `VITE_AI_ENDPOINT` is empty, the app uses a safe mock response so the UI can still be tested.

## Important files

```text
src/main.jsx                  Main React app and pages
src/styles/styles.css          CVForge UI styling
src/services/firebase.js       Firebase initialization
src/services/firestoreService.js Firestore helpers
src/services/aiService.js      AI endpoint wrapper with mock fallback
src/data/sampleData.js         Demo candidate data
firestore.rules                Starter Firestore rules
firebase.json                  Firebase Hosting config
.env.example                   Environment variable template
```

## Notes

This is a front-end prototype with Firebase-ready service wrappers. For production, add stronger Firestore rules, server-side token validation, email verification, file upload validation, backend AI calls, audit logs, and admin moderation screens.
