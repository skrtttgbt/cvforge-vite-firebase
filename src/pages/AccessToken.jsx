import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Logo from "../components/Logo";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import { LockKeyhole, Link2, Eye, ShieldCheck } from "lucide-react";
import {
  findToken,
  saveEmployerCandidateView,
  incrementTokenViews,
} from "../services/firestoreService";

export default function AccessToken() {
  const { tokenValue } = useParams();

  const [tokenInput, setTokenInput] = useState(tokenValue || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const autoAccessRan = useRef(false);

  const verifyAndAccessToken = useCallback(
    async (rawToken) => {
      const cleanToken = rawToken?.trim();

      if (!cleanToken) {
        setError("Please enter a token.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = await findToken(cleanToken);

        if (!token) {
          setError("Invalid or non-existent token.");
          return;
        }

        if (token.status === "Revoked") {
          setError("This token has been revoked by the owner.");
          return;
        }

        const expiresAt =
          token.expiresAt?.toDate?.() || new Date(token.expiresAt);

        if (
          expiresAt &&
          !Number.isNaN(expiresAt.getTime()) &&
          expiresAt < new Date()
        ) {
          setError("This token has expired.");
          return;
        }

        if (token.maxViews && (token.views || 0) >= token.maxViews) {
          setError("This token has reached its access limit.");
          return;
        }

        const employerId = getEmployerVisitorId();

        await saveEmployerCandidateView(employerId, {
          tokenId: token.id,
          tokenValue: token.tokenValue,
          ownerId: token.ownerId,
          candidateName: token.candidateName,
          candidateRole: token.candidateRole,
          candidateEmail: token.candidateEmail,
          accessType: token.accessType,
          expiresAt: token.expiresAt,
          status: token.status || "Active",
          shareLink: token.shareLink,
        });

        await incrementTokenViews(token.id);

        navigate(`/shared-profile/${token.ownerId}`, { replace: true });
      } catch (err) {
        console.error("Token access error:", err);
        setError("Failed to verify token. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!tokenValue || autoAccessRan.current) return;

    autoAccessRan.current = true;
    setTokenInput(tokenValue);
    verifyAndAccessToken(tokenValue);
  }, [tokenValue, verifyAndAccessToken]);

  const handleAccess = async () => {
    await verifyAndAccessToken(tokenInput);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy px-6 py-5 text-white">
        <Logo dark />
        <span className="text-sm font-bold">For ICT Job Seekers</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-ink">
            Access Shared Resume or Portfolio
          </h1>

          <p className="mt-3 text-slate-600">
            Enter the access token provided by the ICT job seeker to view their
            resume or portfolio.
          </p>
        </div>

        <Card className="mt-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="p-2 md:p-8">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-forge">
                <LockKeyhole />
              </div>

              <h2 className="text-center text-2xl font-extrabold text-ink">
                Enter Access Token
              </h2>

              <p className="mt-2 text-center text-slate-600">
                Please enter the access token below.
              </p>

              <div className="mt-6">
                <FormField
                  label=""
                  placeholder="Enter access token here..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>

              {error && (
                <p className="mt-2 text-center text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button
                className="mt-4 w-full"
                onClick={handleAccess}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Access Profile"}
              </Button>

              <div className="my-8 flex items-center gap-4 text-sm text-slate-400">
                <hr className="flex-1" />
                OR
                <hr className="flex-1" />
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                The token is a unique link or code shared by the ICT job seeker
                to allow you to view their professional information.
              </div>
            </section>

            <section className="rounded-xl bg-slate-50 p-6 md:p-8">
              <h2 className="mb-8 text-center text-2xl font-extrabold text-ink">
                How It Works
              </h2>

              <Step
                icon={Link2}
                title="1. Receive Token"
                text="The ICT job seeker shares a token or link with you."
              />

              <Step
                icon={LockKeyhole}
                title="2. Enter Token"
                text="Paste the token and click Access Profile."
              />

              <Step
                icon={Eye}
                title="3. View Profile"
                text="You will be able to view the shared resume or portfolio securely."
              />

              <hr className="my-6" />

              <Step
                icon={ShieldCheck}
                title="Secure Access"
                text="Tokens may expire, reach a view limit, or be revoked by the owner."
              />
            </section>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <b>Important:</b> If the token is invalid, expired, revoked, or has
            reached its view limit, you will not be able to access the profile.
          </div>
        </Card>
      </main>
    </div>
  );
}

function getEmployerVisitorId() {
  const key = "cvforge_employer_visitor_id";
  const existingId = localStorage.getItem(key);

  if (existingId) {
    return existingId;
  }

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `employer-${crypto.randomUUID()}`
      : `employer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(key, newId);

  return newId;
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