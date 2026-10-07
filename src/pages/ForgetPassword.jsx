import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import {
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { sendResetPasswordEmail } from "../services/authservice";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleResetPassword() {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendResetPasswordEmail(email.trim());

      setSuccess(
        "A password reset link has been sent to your email address. Please check your inbox."
      );
    } catch (err) {
      console.error(err);

      switch (err.code) {
        case "auth/user-not-found":
          setError("No account is associated with this email.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        default:
          setError("Unable to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy px-6 py-5 text-white">
        <Logo dark />
        <span className="text-sm font-bold">CVForge Account Recovery</span>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-ink">
            Forgot Your Password?
          </h1>

          <p className="mt-3 text-slate-600">
            Enter your registered email address and we'll send you a password
            reset link.
          </p>
        </div>

        <Card className="mt-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left */}
            <section className="p-2 md:p-8">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-forge">
                <Mail />
              </div>

              <h2 className="text-center text-2xl font-extrabold text-ink">
                Reset Password
              </h2>

              <p className="mt-2 text-center text-slate-600">
                We'll email you a secure link to create a new password.
              </p>

              <div className="mt-6">
                <FormField
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="mt-3 text-center text-sm text-red-600">
                  {error}
                </p>
              )}

              {success && (
                <p className="mt-3 text-center text-sm text-green-600">
                  {success}
                </p>
              )}

              <Button
                className="mt-5 w-full"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Link
                to="/login"
                className="mt-4 block text-center text-sm font-semibold text-forge hover:underline"
              >
                Back to Login
              </Link>
            </section>

            {/* Right */}
            <section className="rounded-xl bg-slate-50 p-6 md:p-8">
              <h2 className="mb-8 text-center text-2xl font-extrabold text-ink">
                How It Works
              </h2>

              <Step
                icon={Mail}
                title="1. Enter Email"
                text="Provide the email address associated with your CVForge account."
              />

              <Step
                icon={KeyRound}
                title="2. Receive Reset Link"
                text="We'll send you a secure password reset link."
              />

              <Step
                icon={CheckCircle2}
                title="3. Create New Password"
                text="Open the email and follow the instructions to set a new password."
              />

              <hr className="my-6" />

              <Step
                icon={ShieldCheck}
                title="Secure Process"
                text="Password reset links expire automatically to keep your account secure."
              />
            </section>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <b>Important:</b> If you don't receive the email within a few
            minutes, check your Spam/Junk folder. Make sure you entered the same
            email address used when creating your CVForge account.
          </div>
        </Card>
      </main>
    </div>
  );
}

function Step({ icon: Icon, title, text }) {
  return (
    <div className="mb-6 flex gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-forge shadow-soft">
        <Icon size={20} />
      </div>

      <div>
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </div>
  );
}