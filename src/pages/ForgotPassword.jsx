import { useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { resetPassword } from "../services/authservice";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (authError) {
      console.error(
        "Password reset error:",
        authError.code,
        authError.message,
        authError
      );

      setError(getFriendlyResetError(authError.code));
    } finally {
      setLoading(false);
    }
  }

  function handleTryAnotherEmail() {
    setSent(false);
    setEmail("");
    setError("");
  }

  return (
    <AuthLayout type="forgot-password">
      {sent ? (
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-ink">
            Check your email
          </h1>

          <p
            className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700"
            role="status"
            aria-live="polite"
          >
            Password reset email sent to{" "}
            <span className="font-bold">{email.trim()}</span>. Check your
            inbox for next steps.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Don't see it? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={handleTryAnotherEmail}
              className="font-bold text-forge"
            >
              try another email
            </button>
            .
          </p>

          <Link to="/login" className="mt-8 block">
            <Button type="button" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-ink">
              Reset Password
            </h1>
            <p className="mt-2 text-slate-500">
              Enter your email and we'll send reset instructions.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />

            {error && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Email"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link to="/login" className="font-bold text-forge">
              Back to login
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

function getFriendlyResetError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";

    case "auth/user-not-found":
      return "No CVForge account uses that email address.";

    case "auth/too-many-requests":
      return "Too many reset attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    case "auth/operation-not-allowed":
      return "Password reset is not enabled in Firebase Authentication.";

    default:
      return "We couldn't send a reset email. Please try again.";
  }
}
