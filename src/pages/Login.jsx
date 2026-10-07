import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import FormField from "../components/FormField";
import Button from "../components/Button";
import TermsModal from "../components/TermsModal";

import {
  loginWithEmail,
  loginWithGoogle,
  loginWithMicrosoft,
} from "../services/authservice";
import { Eye, EyeOff } from "lucide-react"
import { getProfile } from "../services/firestoreService";

import { isProfileComplete } from "../utils/profileValidation";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // null = closed, "terms" | "privacy" = open on that document
  const [legalModal, setLegalModal] = useState(null);

  const isBusy = loading || oauthLoading !== null;

  async function redirectAfterLogin(user) {
    try {
      const existingProfile = await getProfile(user.uid);

      if (isProfileComplete(existingProfile)) {
        navigate("/dashboard", {
          replace: true,
        });

        return true;
      }

      navigate("/complete-profile", {
        replace: true,
        state: {
          user: {
            uid: user.uid,
            fullName: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
          },
        },
      });

      return true;
    } catch (profileError) {
      /*
       * Authentication has already succeeded here.
       * This error is from Firestore, not Firebase Auth.
       */
      console.error(
        "Profile loading error:",
        profileError.code,
        profileError.message,
        profileError
      );

      setError(
        getFriendlyProfileError(profileError.code)
      );

      return false;
    }
  }

  async function handleEmailLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      /*
       * Only authentication errors are caught here.
       * Remember-me is passed to authservice.
       */
      const user = await loginWithEmail(
        email,
        password,
        remember
      );

      await redirectAfterLogin(user);
    } catch (authError) {
      console.error(
        "Email authentication error:",
        authError.code,
        authError.message,
        authError
      );

      setError(
        getFriendlyAuthError(authError.code)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    if (oauthLoading !== null) {
      return;
    }

    setError("");
    setOauthLoading(provider);

    try {
      let user;

      if (provider === "google") {
        user = await loginWithGoogle(remember);
      } else if (provider === "microsoft") {
        user = await loginWithMicrosoft(remember);
      } else {
        throw new Error(
          `Unsupported OAuth provider: ${provider}`
        );
      }

      await redirectAfterLogin(user);
    } catch (authError) {
      console.error(
        `${provider} authentication error:`,
        authError.code,
        authError.message,
        authError
      );

      /*
       * Do not display an error when the user
       * intentionally closes the popup.
       */
      if (
        authError.code === "auth/popup-closed-by-user" ||
        authError.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      setError(
        getFriendlyAuthError(authError.code)
      );
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <AuthLayout type="login">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">
          Welcome Back!
        </h1>

        <p className="mt-2 text-slate-500">
          Login to your CVForge account
        </p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleEmailLogin}
      >
        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={isBusy}
          autoComplete="email"
          required
        />

        <FormField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          disabled={isBusy}
          autoComplete="current-password"
          required
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              disabled={isBusy}
              onChange={(event) =>
                setRemember(event.target.checked)
              }
            />

            <span>Remember me</span>
          </label>

          <Link to="/forgot-password" className="font-bold text-forge" onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </Link>
        </div>

        {error && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isBusy}
        >
          {loading ? "Logging in…" : "Login"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
        <hr className="flex-1" />
        <span>or continue with</span>
        <hr className="flex-1" />
      </div>

      <div className="grid gap-3 ">
        <Button
          variant="outline"
          type="button"
          disabled={isBusy}
          onClick={() => handleOAuth("google")}
        >
          {oauthLoading === "google"
            ? "Signing in…"
            : "Continue with Google"}
        </Button>

        {/* <Button
          variant="outline"
          type="button"
          disabled={isBusy}
          onClick={() => handleOAuth("microsoft")}
        >
          {oauthLoading === "microsoft"
            ? "Signing in…"
            : "Continue with Microsoft"}
        </Button> */}
      </div>

      <Button
        type="button"
        className="mt-3 w-full"
        disabled={isBusy}
        onClick={() => navigate("/access-token")}
      >
        Use Access Token
      </Button>

      <p className="mt-6 text-center text-xs text-slate-500">
        By logging in, you agree to our{" "}
        <button
          type="button"
          onClick={() => setLegalModal("terms")}
          className="text-forge underline-offset-2 hover:underline"
        >
          Terms of Service
        </button>{" "}
        and{" "}
        <button
          type="button"
          onClick={() => setLegalModal("privacy")}
          className="text-forge underline-offset-2 hover:underline"
        >
          Privacy Policy
        </button>
        .
      </p>

      <TermsModal
        open={legalModal !== null}
        type={legalModal || "terms"}
        onClose={() => setLegalModal(null)}
        onSwitch={setLegalModal}
      />
    </AuthLayout>
  );
}

function getFriendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";

    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    case "auth/operation-not-allowed":
      return "This login method is not enabled in Firebase Authentication.";

    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase Authentication.";

    case "auth/popup-blocked":
      return "The login popup was blocked. Allow popups and try again.";

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another login method.";

    default:
      return "Login failed. Please try again.";
  }
}

function getFriendlyProfileError(code) {
  switch (code) {
    case "permission-denied":
      return "Login succeeded, but Firestore denied access to your profile. Check your Firestore security rules.";

    case "unauthenticated":
      return "Login succeeded, but Firestore could not verify your session.";

    case "unavailable":
      return "Login succeeded, but the profile service is temporarily unavailable.";

    case "failed-precondition":
      return "Login succeeded, but the profile database is not configured correctly.";

    default:
      return "Login succeeded, but your profile could not be loaded.";
  }
}