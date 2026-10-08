import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

import { auth, googleProvider, microsoftProvider, missingVariables } from "./firebase";
import { requireFirebaseAuth } from "../utils/firebaseConfig.js";

function getConfiguredAuth() {
  return requireFirebaseAuth(auth, missingVariables);
}

async function applyPersistence(remember = true) {
  await setPersistence(
    getConfiguredAuth(),
    remember ? browserLocalPersistence : browserSessionPersistence,
  );
}
export function verifyResetCode(oobCode) {
  return verifyPasswordResetCode(getConfiguredAuth(), oobCode);
}

// Sets the new password using the same oobCode.
export function confirmReset(oobCode, newPassword) {
  return confirmPasswordReset(getConfiguredAuth(), oobCode, newPassword);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function loginWithEmail(email, password, remember = true) {
  await applyPersistence(remember);

  const result = await signInWithEmailAndPassword(
    getConfiguredAuth(),
    normalizeEmail(email),
    password,
  );

  return result.user;
}

export async function registerWithEmail(email, password, remember = true) {
  await applyPersistence(remember);

  const result = await createUserWithEmailAndPassword(
    getConfiguredAuth(),
    normalizeEmail(email),
    password,
  );

  return result.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(getConfiguredAuth(), normalizeEmail(email));
}

export async function loginWithGoogle(remember = true) {
  await applyPersistence(remember);

  const result = await signInWithPopup(getConfiguredAuth(), googleProvider);

  return result.user;
}

export async function loginWithMicrosoft(remember = true) {
  await applyPersistence(remember);

  const result = await signInWithPopup(getConfiguredAuth(), microsoftProvider);

  return result.user;
}

export async function logoutUser() {
  await signOut(getConfiguredAuth());
}

const authListeners = new Set();
let authInitialized = false;
let cachedUser;
export function onAuthChange(callback) {
  authListeners.add(callback);
  if (!authInitialized) {
    authInitialized = true;
    const publishUser = (user) => {
      cachedUser = user;
      window.dispatchEvent(new Event("auth-user-changed"));
      for (const listener of authListeners) listener(user);
    };
    if (auth) onAuthStateChanged(auth, publishUser, () => publishUser(null));
    else queueMicrotask(() => publishUser(null));
    window.addEventListener("profile-saved", () => {
      if (cachedUser !== undefined)
        for (const listener of authListeners) listener(cachedUser);
    });
  } else if (cachedUser !== undefined)
    queueMicrotask(() => {
      if (authListeners.has(callback)) callback(cachedUser);
    });
  return () => authListeners.delete(callback);
}

export async function sendResetPasswordEmail(email) {
  await resetPassword(email);
}
