import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import { onAuthChange } from "../services/authservice";
import {
  getEmployerCandidateViews,
  updateEmployerCandidateView,
} from "../services/firestoreService";
import { Eye, RefreshCw, Star, Users, ShieldCheck } from "lucide-react";

export default function EmployerDashboard() {
  const [employerId, setEmployerId] = useState(null);
  const [candidateViews, setCandidateViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setEmployerId(user.uid);

      try {
        const views = await getEmployerCandidateViews(user.uid);
        setCandidateViews(views || []);
      } catch (error) {
        console.error("Employer dashboard load error:", error);
        setError("Failed to load employer dashboard data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const uniqueCandidates = new Set(
      candidateViews.map((view) => view.tokenId || view.tokenValue)
    );

    const activeTokens = candidateViews.filter(
      (view) => getAccessStatus(view) === "Active"
    );

    const shortlisted = candidateViews.filter((view) => view.shortlisted);

    return {
      candidatesViewed: uniqueCandidates.size,
      activeTokens: activeTokens.length,
      shortlisted: shortlisted.length,
    };
  }, [candidateViews]);

  const loadViews = async (id = employerId) => {
    if (!id) return;

    try {
      const views = await getEmployerCandidateViews(id);
      setCandidateViews(views || []);
    } catch (error) {
      console.error("Refresh employer views error:", error);
      alert("Failed to refresh dashboard data.");
    }
  };

  const toggleShortlist = async (view) => {
    if (!view?.id) return;

    setUpdatingId(view.id);

    try {
      await updateEmployerCandidateView(view.id, {
        shortlisted: !view.shortlisted,
      });

      await loadViews();
    } catch (error) {
      console.error("Shortlist update error:", error);
      alert("Failed to update shortlist status.");
    }

    setUpdatingId(null);
  };

  if (loading) {
    return (
      <AppLayout title="Employer / HR Dashboard" employer>
        <p>Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Employer / HR Dashboard"
      subtitle="Review shared candidates through token-based access"
      employer
    >
      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Candidates Viewed</p>
              <p className="mt-2 text-3xl font-extrabold">
                {stats.candidatesViewed}
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-forge">
              <Users size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Tokens</p>
              <p className="mt-2 text-3xl font-extrabold">
                {stats.activeTokens}
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-700">
              <ShieldCheck size={22} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Shortlisted</p>
              <p className="mt-2 text-3xl font-extrabold">
                {stats.shortlisted}
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-50 text-yellow-700">
              <Star size={22} />
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Viewed Candidates"
        className="mt-5 overflow-x-auto"
        right={
          <Button variant="outline" onClick={() => loadViews()}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        }
      >
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {candidateViews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            <p className="font-bold text-ink">No candidates viewed yet.</p>
            <p className="mt-1 text-sm">
              Candidates accessed through shared tokens will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3">Candidate</th>
                <th>Role</th>
                <th>Access Type</th>
                <th>Viewed At</th>
                <th>Status</th>
                <th>Shortlisted</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {candidateViews.map((view) => (
                <tr key={view.id} className="border-b last:border-0">
                  <td className="py-3 font-bold">
                    {view.candidateName || "Unnamed Candidate"}
                  </td>

                  <td>{view.candidateRole || "Target ICT Role"}</td>

                  <td>{view.accessType || "Token Access"}</td>

                  <td>{formatFirestoreDate(view.viewedAt)}</td>

                  <td>
                    <StatusBadge status={getAccessStatus(view)} />
                  </td>

                  <td>
                    {view.shortlisted ? (
                      <span className="font-bold text-yellow-700">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      {view.shareLink && (
                        <Button
                          variant="outline"
                          className="px-3 py-1.5"
                          onClick={() => window.open(view.shareLink, "_blank")}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                      )}

                      <Button
                        variant={view.shortlisted ? "outline" : "default"}
                        className="px-3 py-1.5"
                        onClick={() => toggleShortlist(view)}
                        disabled={updatingId === view.id}
                      >
                        <Star size={14} />
                        {updatingId === view.id
                          ? "Updating..."
                          : view.shortlisted
                          ? "Remove"
                          : "Shortlist"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppLayout>
  );
}

function getAccessStatus(view) {
  if (view.status === "Revoked") return "Revoked";

  const expiresAt = view.expiresAt?.toDate?.() || new Date(view.expiresAt);

  if (
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt < new Date()
  ) {
    return "Expired";
  }

  return view.status || "Active";
}

function formatFirestoreDate(value) {
  if (!value) return "Not recorded";

  const date = value?.toDate?.() || new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString();
}