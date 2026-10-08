const requiredFields = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  appId: "VITE_FIREBASE_APP_ID",
};

export function getFirebaseConfig(env) {
  const config = Object.fromEntries(
    Object.entries({
      ...requiredFields,
      storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
      messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    }).map(([field, variable]) => [field, env[variable]?.trim() || ""]),
  );
  const missingVariables = Object.entries(requiredFields)
    .filter(([field]) => !config[field] || config[field].startsWith("your_"))
    .map(([, variable]) => variable);

  return { config, missingVariables };
}

export function requireFirebaseAuth(auth, missingVariables) {
  if (!auth) {
    const error = new Error(
      `Firebase Authentication is not configured. Set ${missingVariables.join(", ")} in the build environment, then rebuild the app.`,
    );
    error.code = "auth/not-configured";
    throw error;
  }
  return auth;
}
