import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { findToken } from "../services/firestoreService";
import ResumePreview from "../components/ResumePreview";
import { PortfolioPreview } from "./WebPortfolio";
export default function SharedProfile() {
  const { tokenValue } = useParams();
  const location = useLocation();
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const redemption = useRef(null);
  useEffect(() => {
    let active = true;
    setToken(null);
    setError("");
    // StrictMode repeats effects in development; consume one view per page load.
    if (redemption.current?.id !== tokenValue) {
      redemption.current = { id: tokenValue, promise: location.state?.sharedToken
        ? Promise.resolve(location.state.sharedToken) : findToken(tokenValue) };
    }
    const load = async () => {
      try {
        const data = await redemption.current.promise;
        if (active) {
          if (!data) setError("Invalid, expired, revoked, or exhausted token.");
          else setToken(data);
        }
      } catch {
        if (active)
          setError("Access denied. This token is no longer available.");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tokenValue]);
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl p-4">
      <h1>Shared Portfolio</h1>
      {error && <p role="alert">{error}</p>}
      {!token && !error && <p>Loading authorized content…</p>}
      {token?.sharedResume && (
        <ResumePreview profile={{}} draft={token.sharedResume} />
      )}{" "}
      {token?.sharedPortfolio && (
        <PortfolioPreview
          profile={{}}
          draft={token.sharedPortfolio}
          profileSources={token.sharedSources || []}
          hasResume={false}
          onToggleContact={() => {}}
        />
      )}
      {token?.allowDownload && (
        <button onClick={() => window.print()}>
          Print / Download shared content
        </button>
      )}
      <a href="/">Return Home</a>
    </main>
  );
}
