import LoadingSkeleton from '../components/LoadingSkeleton';
import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";
import Swal from "sweetalert2";
import { onAuthChange } from "../services/authservice";
import {
  getProfile,
  getResumeDraft,
  getWebPortfolioDraft,
  createToken,
  getTokensByOwner,
  revokeToken,
  deleteToken,
} from "../services/firestoreService";
import {
  Copy,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Ban,
} from "lucide-react";

const defaultForm = {
  accessType: "Full Access Resume & Portfolio",
  expiration: "7 Days",
  accessLimit: "Unlimited Views",
  allowDownload: false,
};

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

export default function TokenManagement() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [outputStatus, setOutputStatus] = useState({resume:'Not generated',portfolio:'Not generated'});

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedProfile = await getProfile(user.uid);
        const savedTokens = await getTokensByOwner(user.uid);
        const [resume,portfolio] = await Promise.all([getResumeDraft(user.uid),getWebPortfolioDraft(user.uid)]);
        setOutputStatus({resume:resume?.draft?.status || 'Not generated',portfolio:portfolio?.draft?.status || 'Not generated'});

        setProfile(savedProfile || null);
        setTokens(savedTokens || []);
      } catch (error) {
        console.error("Token page load error:", error);
        setError("Failed to load your token data from Firestore.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const candidateName = profile?.fullName || "Unnamed Candidate";
  const candidateRole = profile?.targetRole || "Target ICT Role";
  const candidateLabel = `${candidateName} - ${candidateRole}`;

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const loadTokens = async (ownerId = userId) => {
    if (!ownerId) return;

    setLoading(true);

    try {
      const savedTokens = await getTokensByOwner(ownerId);
      setTokens(savedTokens || []);

      toast.fire({
        icon: "success",
        title: "Tokens refreshed",
      });
    } catch (error) {
      console.error("Load tokens error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load your tokens.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "Login required",
        text: "You must be logged in to generate a token.",
      });
      return;
    }

    setGenerating(true);

    Swal.fire({
      title: "Generating token...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const expiresAt = getExpirationDate(form.expiration);

      const tokenData = {
        accessType: form.accessType,
        expiration: form.expiration,
        expiresAt,
        accessLimit: form.accessLimit,
        maxViews: getMaxViews(form.accessLimit),
        allowDownload: form.allowDownload,
      };

      const savedToken = await createToken(userId, tokenData);

      const newToken = {
        ...savedToken,
        tokenValue: savedToken.tokenValue,
        shareLink: savedToken.shareLink,
      };

      setGeneratedToken(newToken);
      await loadTokens(userId);

      Swal.fire({
        icon: "success",
        title: "Token generated",
        text: "Your access token is ready.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Generate token error:", error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.message || "Failed to generate token.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedToken?.shareLink) {
      Swal.fire("No token", "Generate a token first.", "warning");
      return;
    }

    await navigator.clipboard.writeText(generatedToken.shareLink);

    toast.fire({
      icon: "success",
      title: "Link copied",
    });
  };

  const handleCopyToken = async () => {
    if (!generatedToken?.tokenValue) {
      Swal.fire("No token", "Generate a token first.", "warning");
      return;
    }

    await navigator.clipboard.writeText(generatedToken.tokenValue);

    toast.fire({
      icon: "success",
      title: "Token copied",
    });
  };

  const handleShareEmail = () => {
    if (!generatedToken?.shareLink) {
      alert("Generate or view a token first.");
      return;
    }

    const subject = encodeURIComponent("Candidate Profile Access Link");
    const body = encodeURIComponent(
      `Hello,

You can access the candidate profile using this secure link:

${generatedToken.shareLink}

Access Type: ${generatedToken.accessType}
Expiration: ${generatedToken.expiration}

Thank you.`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleViewToken = (token) => {
    setGeneratedToken(token);
  };

  const handleRevoke = async (token) => {
    if (!token?.id) return;

    if (token.ownerId !== userId) {
      Swal.fire({
        icon: "error",
        title: "Not allowed",
        text: "You can only revoke your own token.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Revoke token?",
      text: "This will immediately disable access.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, revoke",
    });

    if (!result.isConfirmed) return;

    setRevokingId(token.id);

    Swal.fire({
      title: "Revoking...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await revokeToken(token.id);
      await loadTokens();

      Swal.fire({
        icon: "success",
        title: "Revoked",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not revoke token.",
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleDelete = async (token) => {
    if (!token?.id) return;

    if (token.ownerId !== userId) {
      Swal.fire({
        icon: "error",
        title: "Not allowed",
        text: "You can only delete your own token.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete token?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setDeletingId(token.id);

    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await deleteToken(token.id);
      await loadTokens();

      if (generatedToken?.id === token.id) {
        setGeneratedToken(null);
      }

      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete token.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Generate Access Token">
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Generate Access Token"
      subtitle="Create a secure token to share your resume or portfolio"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.8fr]">
        <Card title="Set Access & Permissions">
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              View limits count accesses through CVForge. They cannot prevent
              direct reads before the limit is reached or copying shared content.
              Expiration and revocation block future access.
            </p>
            <FormField label="Candidate" as="select" value={candidateLabel}>
              <option value={candidateLabel}>{candidateLabel}</option>
            </FormField>

            <FormField
              label="Access Type"
              as="select"
              name="accessType"
              value={form.accessType}
              onChange={handleChange}
            >
              <option value="Full Access Resume & Portfolio">
                Full Access Resume & Portfolio
              </option>
              <option value="Resume Only">Resume Only</option>
              <option value="Portfolio Only">Portfolio Only</option>
            </FormField>

            <FormField
              label="Token Expiration"
              as="select"
              name="expiration"
              value={form.expiration}
              onChange={handleChange}
            >
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </FormField>

            <FormField
              label="Access Limit"
              as="select"
              name="accessLimit"
              value={form.accessLimit}
              onChange={handleChange}
            >
              <option value="One Time">One Time View</option>
              <option value="Unlimited Views">Unlimited Views</option>
              <option value="5 Views">5 Views</option>
              <option value="10 Views">10 Views</option>
              <option value="25 Views">25 Views</option>
            </FormField>
          </div>
          <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
            {/resume/i.test(form.accessType) && <p>Resume: <b>{outputStatus.resume}</b>. {outputStatus.resume !== 'approved' && <a className="text-forge underline" href="/resume-builder">Generate or edit your resume and complete the final review.</a>}</p>}
            {/portfolio/i.test(form.accessType) && <p>Portfolio: <b>{outputStatus.portfolio}</b>. {outputStatus.portfolio !== 'approved' && <a className="text-forge underline" href="/web-portfolio">Review your portfolio, then choose Approve for Publishing.</a>}</p>}
            <p>Full Access requires both outputs to be approved. Profile edits return existing outputs to Draft.</p>
          </div>

          <label className="mt-4 flex gap-2 text-sm">
            <input
              type="checkbox"
              name="allowDownload"
              checked={form.allowDownload}
              onChange={handleChange}
            />
            Allow download of resume
          </label>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            onClick={handleGenerateToken}
            disabled={generating}
          >
            <ShieldCheck size={16} />
            {generating ? "Generating..." : "Generate Token"}
          </Button>
        </Card>

        <Card title="Selected / Generated Token">
          {generatedToken ? (
            <>
              <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
                <b>Token ready.</b>
                <p>You can copy the token or shareable link below.</p>
              </div>

              <div className="mt-5 grid gap-4">
                <FormField
                  label="Access Token"
                  value={generatedToken.tokenValue || ""}
                  readOnly
                />

                <FormField
                  label="Shareable Link"
                  value={generatedToken.shareLink || ""}
                  readOnly
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleCopyToken}>
                  <Copy size={16} />
                  Copy Token
                </Button>

                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy size={16} />
                  Copy Link
                </Button>

                <Button variant="outline" onClick={handleShareEmail}>
                  <Mail size={16} />
                  Share via Email
                </Button>
              </div>

              {generatedToken.status !== "Revoked" && (
                <Button
                  variant="danger"
                  className="mt-4 w-full"
                  onClick={() => handleRevoke(generatedToken)}
                >
                  <Ban size={16} />
                  Revoke Token
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <p className="font-bold text-ink">No token selected.</p>
              <p className="mt-1 text-sm">
                Generate a token or click View from your token list.
              </p>
            </div>
          )}
        </Card>

        <Card title="How Tokens Work">
          <div className="space-y-5 text-sm text-slate-600">
            <p>
              <b className="text-ink">Own Tokens Only</b>
              <br />
              You can only see and manage tokens created by your account.
            </p>

            <p>
              <b className="text-ink">Secure Access</b>
              <br />
              Tokens provide secure, time-bound access to your resume or portfolio.
            </p>

            <p>
              <b className="text-ink">Set Expiration</b>
              <br />
              Choose when the token expires automatically.
            </p>

            <p>
              <b className="text-ink">Revoke Anytime</b>
              <br />
              You can revoke your own tokens at any time.
            </p>
          </div>
        </Card>
      </div>

      <Card title="My Tokens" className="mt-5 overflow-x-auto">
        {tokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            <p className="font-bold text-ink">No tokens yet.</p>
            <p className="mt-1 text-sm">
              Tokens you generate will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Candidate</th>
                <th>Token</th>
                <th>Access Type</th>
                <th>Expires On</th>
                <th>Views</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b last:border-0">
                  <td className="py-3 font-bold">
                    {token.candidate || token.candidateName || candidateLabel}
                  </td>

                  <td className="max-w-[220px] truncate">
                    {token.tokenValue}
                  </td>

                  <td>{token.accessType}</td>

                  <td>{formatFirestoreDate(token.expiresAt)}</td>

                  <td>
                    {token.views || 0}
                    {token.maxViews ? ` / ${token.maxViews}` : ""}
                  </td>

                  <td>
                    <StatusBadge status={getTokenStatus(token)} />
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="px-3 py-1.5"
                        onClick={() => handleViewToken(token)}
                      >
                        View
                      </Button>

                      {token.status !== "Revoked" && (
                        <Button
                          variant="danger"
                          className="px-3 py-1.5"
                          onClick={() => handleRevoke(token)}
                          disabled={revokingId === token.id}
                        >
                          {revokingId === token.id ? "Revoking..." : "Revoke"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        className="px-3 py-1.5"
                        onClick={() => handleDelete(token)}
                        disabled={deletingId === token.id}
                      >
                        <Trash2 size={14} />
                        {deletingId === token.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Button variant="outline" className="mt-4" onClick={() => loadTokens()}>
          <RefreshCw size={16} />
          Refresh My Tokens
        </Button>
      </Card>
    </AppLayout>
  );
}

function getExpirationDate(expiration) {
  const date = new Date();

  if (expiration === "7 Days") {
    date.setDate(date.getDate() + 7);
  } else if (expiration === "30 Days") {
    date.setDate(date.getDate() + 30);
  } else if (expiration === "60 Days") {
    date.setDate(date.getDate() + 60);
  } else if (expiration === "90 Days") {
    date.setDate(date.getDate() + 90);
  }

  return date;
}

function getMaxViews(accessLimit) {
  if (accessLimit === "Unlimited Views") return null;

  const number = Number(accessLimit.split(" ")[0]);

  return Number.isNaN(number) ? null : number;
}

function formatFirestoreDate(value) {
  if (!value) return "No expiration";

  const date = value?.toDate?.() || new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString();
}

function getTokenStatus(token) {
  if (token.status === "Revoked") return "Revoked";

  const expiresAt = token.expiresAt?.toDate?.() || new Date(token.expiresAt);

  if (
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt < new Date()
  ) {
    return "Expired";
  }

  if (token.maxViews && (token.views || 0) >= token.maxViews) {
    return "Limit Reached";
  }

  return token.status || "Active";
}
