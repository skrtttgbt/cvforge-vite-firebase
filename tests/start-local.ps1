$env:VITE_USE_EMULATORS = 'true'
$env:VITE_FIREBASE_PROJECT_ID = 'demo-cvforge'
$env:VITE_AI_PROVIDER = 'mock'
rtk proxy npm run dev -- --host 127.0.0.1
