import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { verifyResetCode, confirmReset } from "../services/authservice";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Validate the link as soon as the page loads.
  useEffect(() => {
    let cancelled = false;

    async function checkCode() {
      if (!oobCode) {
        setError("This reset link is missing its code. Request a new one.");
        setChecking(false);
        return;
      }

      try {
        const email = await verifyResetCode(oobCode);
        if (cancelled) return;
        setAccountEmail(email);
        setCodeValid(true);
      } catch (authError) {
        if (cancelled) return;
        console.error("Reset code error:", authError.code, authError.message);
        setError(getFriendlyResetError(authError.code));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkCode();
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await confirmReset(oobCode, password);
      setDone(true);
    } catch (authError) {
      console.error(
        "Confirm reset error:",
        authError.code,
        authError.message,
        authError
      );

      const message = getFriendlyResetError(authError.code);
      setError(message);

      // An expired or used link can't be retried, so stop showing the form.
      if (
        authError.code === "auth/expired-action-code" ||
        authError.code === "auth/invalid-action-code"
      ) {
        setCodeValid(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout type="reset-password">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-ink">
          {done ? "Password updated" : "Choose a new password"}
        </h1>
        <p className="mt-2 text-slate-500">
          {done
            ? "You can now log in with your new password."
            : codeValid
            ? `Set a new password for ${accountEmail}.`
            : checking
            ? "Checking your reset link..."
            : "We couldn't use this reset link."}
        </p>
      </div>

      {error && (
        <p
          className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {codeValid && !done && (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <FormField
            label="New Password"
            type="password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />

          <FormField
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save New Password"}
          </Button>
        </form>
      )}

      {done && (
        <div className="mt-8">
          <Link to="/login">
            <Button type="button" className="w-full">
              Go to login
            </Button>
          </Link>
        </div>
      )}

      {!checking && !codeValid && !done && (
        <div className="mt-8">
          <Link to="/forgot-password">
            <Button type="button" className="w-full">
              Request a new link
            </Button>
          </Link>
        </div>
      )}

      {!done && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered your password?{" "}
          <Link to="/login" className="font-bold text-forge">
            Back to login
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

function getFriendlyResetError(code) {
  switch (code) {
    case "auth/expired-action-code":
      return "This reset link has expired. Request a new one.";

    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used. Request a new one.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/user-not-found":
      return "No CVForge account matches this reset link.";

    case "auth/weak-password":
      return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    default:
      return "We couldn't reset your password. Please try again.";
  }
}
