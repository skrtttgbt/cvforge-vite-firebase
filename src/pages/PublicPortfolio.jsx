import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import { getPublishedWebPortfolio } from "../services/firestoreService";
import { PortfolioPreview } from "./WebPortfolio";

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPortfolio() {
      setLoading(true);
      setError("");

      try {
        const published = await getPublishedWebPortfolio(slug);
        if (!active) return;
        setPortfolio(published);
      } catch (error) {
        console.error("Published portfolio load error:", error);
        if (active) setError("Unable to load this portfolio.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPortfolio();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-500">Loading portfolio...</p>
      </main>
    );
  }

  if (error || !portfolio) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-soft">
          <h1 className="text-xl font-extrabold text-ink">Portfolio Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error || "This portfolio is not published or the link is incorrect."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>

        <PortfolioPreview
          draft={portfolio.draft}
          profile={portfolio.publicProfile}
          profileSources={portfolio.publicSources || []}
          showContact
          onToggleContact={() => {}}
          onDownloadResume={() => window.print()}
          downloading={false}
          hasResume
        />
      </div>
    </main>
  );
}
