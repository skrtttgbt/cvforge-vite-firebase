import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import { onAuthChange } from "../services/authservice";
import {
  getEmployerCandidateViews,
  getProfileSources,
  getWebPortfolioDraft,
} from "../services/firestoreService";
import { Download, FileText, Globe, Link2, RefreshCw, ShieldCheck } from "lucide-react";

export default function EmployerDashboard() {
  const [employerId, setEmployerId] = useState(null);
  const [candidateViews, setCandidateViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async () => {
      const currentEmployerId = getEmployerVisitorId();
      setEmployerId(currentEmployerId);

      try {
        const views = await getEmployerCandidateViews(currentEmployerId);
        setCandidateViews(await enrichCandidateViews(views || []));
      } catch (error) {
        console.error("Employer dashboard load error:", error);
        setError("Failed to load employer dashboard data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const activeTokens = candidateViews.filter(
      (view) => getAccessStatus(view) === "Active"
    );

    const portfoliosAvailable = candidateViews.filter((view) =>
      Boolean(getPortfolioUrl(view))
    );

    return {
      portfoliosAvailable: portfoliosAvailable.length,
      activeTokens: activeTokens.length,
      profileSources: candidateViews.reduce(
        (total, view) => total + (view.profileSources?.length || 0),
        0
      ),
    };
  }, [candidateViews]);

  const loadViews = async (id = employerId) => {
    if (!id) return;

    try {
      const views = await getEmployerCandidateViews(id);
      setCandidateViews(await enrichCandidateViews(views || []));
    } catch (error) {
      console.error("Refresh employer views error:", error);
      alert("Failed to refresh dashboard data.");
    }
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
              <p className="text-sm text-slate-500">Web Portfolios</p>
              <p className="mt-2 text-3xl font-extrabold">
                {stats.portfoliosAvailable}
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-forge">
              <Globe size={22} />
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
              <p className="text-sm text-slate-500">Profile Sources</p>
              <p className="mt-2 text-3xl font-extrabold">
                {stats.profileSources}
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-50 text-yellow-700">
              <Link2 size={22} />
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Candidate Access"
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
          <div className="grid gap-4">
            {candidateViews.map((view) => {
              const resumeUrl = getResumeUrl(view);
              const portfolioUrl = getPortfolioUrl(view);

              return (
                <section
                  key={view.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold text-ink">
                        {view.candidateName || "Unnamed Candidate"}
                      </h3>
                      <p className="font-bold text-forge">
                        {view.candidateRole || "Target ICT Role"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {view.accessType || "Token Access"} | Viewed {formatFirestoreDate(view.viewedAt)}
                      </p>
                    </div>

                    <StatusBadge status={getAccessStatus(view)} />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 font-bold text-ink">
                        <Link2 size={16} />
                        Profile Sources
                      </div>

                      {view.profileSources?.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {view.profileSources.map((source) => (
                            <a
                              key={`${view.id}-${source.name}`}
                              href={formatUrl(source.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-forge hover:bg-blue-50"
                            >
                              {source.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No profile sources available.
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 font-bold text-ink">Actions</div>
                      <div className="grid gap-2 ">
                        <Button
                          variant="outline"
                          className="px-3 py-2"
                          disabled={!portfolioUrl}
                          onClick={() => window.open(portfolioUrl, "_blank")}
                        >
                          <Globe size={14} />
                          View Portfolio
                        </Button>

                        {/* <Button
                          variant="outline"
                          className="px-3 py-2"
                          disabled={!resumeUrl}
                          onClick={() => window.open(resumeUrl, "_blank")}
                        >
                          <FileText size={14} />
                          View Resume
                        </Button> */}

                        <Button
                          className="px-3 py-2"
                          disabled={!resumeUrl}
                          onClick={() => window.open(resumeUrl, "_blank")}
                        >
                          <Download size={14} />
                          Download Resume
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

async function enrichCandidateViews(views) {
  return Promise.all(
    views.map(async (view) => {
      const existingSources = (view.profileSources || []).filter(
        (source) => source.url && source.url.trim()
      );
      const existingPortfolioUrl = getPortfolioUrl(view);

      if (!view.ownerId || (existingSources.length && existingPortfolioUrl)) {
        return {
          ...view,
          profileSources: existingSources,
          portfolioUrl: existingPortfolioUrl,
        };
      }

      try {
        const [savedSources, savedPortfolio] = await Promise.all([
          getProfileSources(view.ownerId),
          getWebPortfolioDraft(view.ownerId),
        ]);

        const profileSources = existingSources.length
          ? existingSources
          : (savedSources?.sources || []).filter(
          (source) => source.url && source.url.trim()
        );

        return {
          ...view,
          profileSources,
          portfolioUrl:
            existingPortfolioUrl || getPublishedPortfolioUrl(savedPortfolio),
        };
      } catch (error) {
        console.error("Candidate enrichment error:", error);
        return view;
      }
    })
  );
}

function getPublishedPortfolioUrl(portfolio) {
  if (!portfolio?.published) return "";

  if (portfolio.publicUrl) return portfolio.publicUrl;
  if (portfolio.publicPath) return portfolio.publicPath;
  if (portfolio.publicSlug) return `/portfolio/${portfolio.publicSlug}`;

  return "";
}

function getPortfolioUrl(view) {
  return view.portfolioUrl || "";
}

function getResumeUrl(view) {
  if (view.shareLink) return view.shareLink;
  if (view.ownerId) return `/shared-profile/${view.ownerId}`;

  return "";
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

function formatUrl(url) {
  if (!url) return "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

function getEmployerVisitorId() {
  const key = "cvforge_employer_visitor_id";
  const existingId = localStorage.getItem(key);

  if (existingId) return existingId;

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `employer-${crypto.randomUUID()}`
      : `employer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(key, newId);

  return newId;
}
