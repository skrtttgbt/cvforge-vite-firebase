import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import FormField from "../components/FormField";
import Button from "../components/Button";
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithMicrosoft,
} from "../services/authservice";
import { getProfile } from "../services/firestoreService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [error, setError] = useState("");

  async function redirectAfterLogin(user) {
    const existing = await getProfile(user.uid);

    console.log("Logged in user:", user.uid);
    console.log("Existing profile:", existing);

    if (isProfileComplete(existing)) {
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate("/complete-profile", {
      replace: true,
      state: {
        user: {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email || "",
        },
      },
    });
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginWithEmail(email, password);
      await redirectAfterLogin(user);
    } catch (err) {
      console.error("Email login error:", err);
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setError("");
    setOauthLoading(provider);

    try {
      const user =
        provider === "google"
          ? await loginWithGoogle()
          : await loginWithMicrosoft();

      await redirectAfterLogin(user);
    } catch (err) {
      console.error("OAuth login error:", err);

      if (
        err.code !== "auth/popup-closed-by-user" &&
        err.code !== "auth/cancelled-popup-request"
      ) {
        setError(getFriendlyError(err.code));
      }
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <AuthLayout type="login">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">Welcome Back!</h1>
        <p className="mt-2 text-slate-500">Login to your CVForge account</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleEmailLogin}>
        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          <Link to="/forgot-password" className="font-bold text-forge">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Login"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
        <hr className="flex-1" />
        or continue with
        <hr className="flex-1" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          type="button"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth("google")}
        >
          {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth("microsoft")}
        >
          {oauthLoading === "microsoft"
            ? "Redirecting…"
            : "Continue with Microsoft"}
        </Button>
      </div>
      <Button
        // variant="outline"
        type="button"
        className="mt-3 w-full"
        onClick={() => navigate("/access-token")}
      >
        Use Access Token
      </Button>
      <p className="mt-6 text-center text-xs text-slate-500">
        By logging in, you agree to our{" "}
        <Link to="/terms" className="text-forge">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-forge">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}

function isProfileComplete(profile) {
  if (!profile) return false;

  if (profile.profileComplete === true) return true;

  const hasBasicProfile =
    profile.fullName?.trim() &&
    profile.email?.trim() &&
    profile.targetRole?.trim();

  return Boolean(hasBasicProfile);
}

function getFriendlyError(code) {
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
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      return "Something went wrong. Please try again.";
  }
}