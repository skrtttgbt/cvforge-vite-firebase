import test from "node:test";
import assert from "node:assert/strict";
import { getFirebaseConfig, requireFirebaseAuth } from "../src/utils/firebaseConfig.js";

const validEnv = {
  VITE_FIREBASE_API_KEY: "test-key",
  VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "test-project",
  VITE_FIREBASE_APP_ID: "test-app",
};

test("Firebase config trims values and accepts optional fields being absent", () => {
  const { config, missingVariables } = getFirebaseConfig({
    ...validEnv,
    VITE_FIREBASE_API_KEY: " test-key ",
    VITE_FIREBASE_STORAGE_BUCKET: " test-bucket ",
  });
  assert.deepEqual(missingVariables, []);
  assert.equal(config.apiKey, "test-key");
  assert.equal(config.storageBucket, "test-bucket");
});

test("Firebase config reports missing, blank, and template values", () => {
  assert.equal(getFirebaseConfig({}).missingVariables.length, 4);
  assert.deepEqual(getFirebaseConfig({
    ...validEnv,
    VITE_FIREBASE_API_KEY: "   ",
    VITE_FIREBASE_AUTH_DOMAIN: "your_project.firebaseapp.com",
  }).missingVariables, ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN"]);
});

test("Missing auth throws an actionable error before calling Firebase", () => {
  assert.throws(() => requireFirebaseAuth(null, ["VITE_FIREBASE_API_KEY"]), {
    code: "auth/not-configured",
    message: /VITE_FIREBASE_API_KEY.*rebuild/,
  });
  const auth = { name: "configured-auth" };
  assert.equal(requireFirebaseAuth(auth, []), auth);
});
