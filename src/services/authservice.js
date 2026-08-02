import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import {
  auth,
  googleProvider,
  microsoftProvider,
} from "./firebase";

async function applyPersistence(remember = true) {
  await setPersistence(
    auth,
    remember
      ? browserLocalPersistence
      : browserSessionPersistence
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function loginWithEmail(
  email,
  password,
  remember = true
) {
  await applyPersistence(remember);

  const result = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password
  );

  return result.user;
}

export async function registerWithEmail(
  email,
  password,
  remember = true
) {
  await applyPersistence(remember);

  const result = await createUserWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password
  );

  return result.user;
}

export async function loginWithGoogle(remember = true) {
  await applyPersistence(remember);

  const result = await signInWithPopup(
    auth,
    googleProvider
  );

  return result.user;
}

export async function loginWithMicrosoft(remember = true) {
  await applyPersistence(remember);

  const result = await signInWithPopup(
    auth,
    microsoftProvider
  );

  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}