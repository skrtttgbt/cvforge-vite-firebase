import { defineConfig, loadEnv } from "vite";
import { getFirebaseConfig } from "./src/utils/firebaseConfig.js";

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
  const { missingVariables } = getFirebaseConfig(env);

  if (command === "build" && missingVariables.length) {
    throw new Error(
      `Cannot build without Firebase configuration: ${missingVariables.join(", ")}. Set these in .env or your hosting provider's build environment, then rebuild.`,
    );
  }

  return {};
});
