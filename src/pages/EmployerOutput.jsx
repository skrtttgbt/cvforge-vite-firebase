import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ResumePreview from "../components/ResumePreview";
import ProfileAvatar from '../components/ProfileAvatar';
import { PortfolioPreview } from "./WebPortfolio";
export default function EmployerOutput() {
  const { tokenValue, outputType } = useParams();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [showContact, setShowContact] = useState(false);
  useEffect(() => {
    const nonce = new URLSearchParams(window.location.search).get("request");
    if (
      !window.opener ||
      !nonce ||
      !["resume", "portfolio"].includes(outputType)
    ) {
      setError("Open this view from your authorized employer dashboard.");
      return;
    }
    const receive = (event) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.opener ||
        event.data?.type !== "cvforge-output" ||
        event.data.nonce !== nonce
      )
        return;
      setData(event.data.output);
      clearTimeout(timer);
    };
    window.addEventListener("message", receive);
    const timer = setTimeout(
      () =>
        setError(
          "The authorized dashboard is no longer available. Open the view again from that dashboard.",
        ),
      8000,
    );
    window.opener.postMessage(
      { type: "cvforge-output-ready", nonce, tokenValue, outputType },
      window.location.origin,
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, [tokenValue, outputType]);
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-bold">
        {outputType === "portfolio" ? "Shared Portfolio" : "Shared Resume"}
      </h1>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading authorized content…</p>}
      {data && <header className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><ProfileAvatar src={data.draft?.resume?.imgUrl} alt={`${data.draft?.resume?.fullName || 'Candidate'} profile photo`} className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover"/><div><h2 className="text-xl font-bold">{data.draft?.resume?.fullName || 'Shared candidate'}</h2>{data.draft?.resume?.targetRole && <p className="text-forge">{data.draft.resume.targetRole}</p>}</div></header>}
      {data &&
        (outputType === "resume" ? (
          <ResumePreview profile={{}} draft={data.draft} />
        ) : (
          <PortfolioPreview
            profile={{}}
            photoSrc={data.draft?.resume?.imgUrl}
            draft={data.draft}
            profileSources={data.sources || []}
            hasResume={false}
            showContact={showContact}
            onToggleContact={() => setShowContact((value) => !value)}
          />
        ))}
    </main>
  );
}
