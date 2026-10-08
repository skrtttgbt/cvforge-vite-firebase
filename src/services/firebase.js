import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFirebaseConfig } from "../utils/firebaseConfig.js";

const { config: firebaseConfig, missingVariables } = getFirebaseConfig(import.meta.env);

const isConfigured = missingVariables.length === 0;
const app = isConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
if (app && import.meta.env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8089);
}
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
export { isConfigured, missingVariables };
