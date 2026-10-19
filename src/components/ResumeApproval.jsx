import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Pencil, X } from "lucide-react";
import Button from "./Button";
import ResumePreview from "./ResumePreview";
import { normalizeResume } from "../utils/resumeContent";

export default function ResumeApproval({
  resume,
  profile,
  onApprove,
  onEdit,
  onCancel,
  outputName = "Resume",
}) {
  const [reviewedResume] = useState(() => normalizeResume(resume, profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const busy = useRef(false);
  const cancel = useRef(onCancel);

  busy.current = saving;
  cancel.current = onCancel;

  useEffect(() => {
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();

    function keydown(event) {
      if (event.key === "Escape" && !busy.current) cancel.current();
    }

    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      trigger?.focus();
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  async function approve() {
    setError("");
    setSaving(true);
    try {
      await onApprove(reviewedResume);
    } catch (approvalError) {
      setError(
        approvalError.message || "Approval could not be saved. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex min-w-0 flex-col bg-slate-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div>
          <h2 id="resume-review-title" className="font-extrabold text-ink">
            Review {outputName}
          </h2>
          <p className="text-xs text-slate-500">
            Approve the complete {outputName.toLowerCase()} or edit its information.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
          >
            <X size={16} /> Close
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onEdit}
          >
            <Pencil size={16} /> Edit {outputName}
          </Button>
          <Button type="button" disabled={saving} onClick={approve}>
            <CheckCircle2 size={16} />
            {saving ? "Approving..." : `Approve ${outputName}`}
          </Button>
        </div>
      </header>

      <main
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-review-title"
        className="min-h-0 flex-1 overflow-y-auto p-3 outline-none sm:p-6 lg:p-8"
      >
        {error && (
          <p
            role="alert"
            className="mx-auto mb-4 max-w-5xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mx-auto w-full max-w-5xl shadow-xl">
          <ResumePreview profile={{}} draft={{ resume: reviewedResume }} />
        </div>
      </main>
    </div>
  );
}
