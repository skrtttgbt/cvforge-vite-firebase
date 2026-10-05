import { useEffect, useRef } from "react";

/*
 * Replace the placeholder text below with your real legal copy.
 * Each section: { heading, body }
 */
const DOCUMENTS = {
  terms: {
    title: "Terms of Service",
    updated: "Last updated: October 2026",
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: "By creating an account or logging in to CVForge, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
      },
      {
        heading: "2. Your account",
        body: "You are responsible for keeping your login details secure and for all activity under your account. Provide accurate information and notify us right away if you suspect unauthorized access.",
      },
      {
        heading: "3. Your content",
        body: "You keep ownership of the resumes and information you create in CVForge. You give us permission to store and process that content only to provide the service to you.",
      },
      {
        heading: "4. Acceptable use",
        body: "Do not use CVForge to submit false information, break the law, attempt to access other users' data, or disrupt the service.",
      },
      {
        heading: "5. Termination",
        body: "You may stop using CVForge at any time. We may suspend or close accounts that violate these terms.",
      },
      {
        heading: "6. Changes to these terms",
        body: "We may update these terms from time to time. Continued use of CVForge after changes means you accept the updated terms.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: October 2026",
    sections: [
      {
        heading: "1. Information we collect",
        body: "We collect your name, email address, profile photo (when you sign in with Google or Microsoft), and the resume details you enter.",
      },
      {
        heading: "2. How we use it",
        body: "We use your information to run your account, build your resumes, and improve CVForge. We do not sell your personal data.",
      },
      {
        heading: "3. Storage and security",
        body: "Your data is stored with Firebase services and protected by access rules and encryption in transit.",
      },
      {
        heading: "4. Your choices",
        body: "You can update or delete your profile information at any time, and you can request deletion of your account.",
      },
      {
        heading: "5. Contact",
        body: "Questions about privacy? Contact the CVForge team through the support link in the app.",
      },
    ],
  },
};

export default function TermsModal({ open, type = "terms", onClose, onSwitch }) {
  const closeRef = useRef(null);
  const doc = DOCUMENTS[type] || DOCUMENTS.terms;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="legal-modal-title"
              className="text-xl font-extrabold text-ink"
            >
              {doc.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{doc.updated}</p>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forge"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-600">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-bold text-ink">{section.heading}</h3>
              <p className="mt-1">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => onSwitch(type === "terms" ? "privacy" : "terms")}
            className="text-sm font-bold text-forge"
          >
            {type === "terms" ? "View Privacy Policy" : "View Terms of Service"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-forge px-5 py-2 text-sm font-bold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-forge focus-visible:ring-offset-2"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}