import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import {
  normalizeResume,
  resumeSections,
  reviewCandidates,
} from "../utils/resumeContent";

export default function ResumeApproval({
  resume,
  profile,
  onApprove,
  onCancel,
  outputName = 'Resume',
}) {
  const [base] = useState(() => normalizeResume(resume, profile));
  const [questions] = useState(() => {
    const candidates = reviewCandidates(resume, profile);
    const list = [];
    if (base.professionalSummary)
      list.push({
        key: "professionalSummary",
        item: base.professionalSummary,
        question: "Do you want to include this summary?",
      });
    for (const section of resumeSections)
      for (const { item } of candidates[section.key])
        list.push({
          key: section.key,
          item,
          question:
            section.key === "technicalSkills"
              ? "Do you want to add this skill?"
              : `Do you want to include this ${section.singular}?`,
        });
    for (const [key, name] of [
      ["email", "email address"],
      ["phone", "phone number"],
      ["location", "location"],
    ]) {
      if (base.contact[key])
        list.push({
          key: "contact",
          field: key,
          item: base.contact[key],
          question: `Do you want to include this ${name}?`,
        });
    }
    return list;
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null),
    cancel = useRef(onCancel),
    busy = useRef(false);
  cancel.current = onCancel;
  busy.current = saving;
  useEffect(() => {
    const trigger = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function keydown(event) {
      if (event.key === "Escape" && !busy.current) cancel.current();
      if (event.key === "Tab") {
        const controls = [
          ...dialog.current.querySelectorAll(
            'button:not(:disabled),[tabindex="0"]',
          ),
        ];
        const first = controls[0],
          last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === dialog.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      trigger?.focus();
      window.removeEventListener("keydown", keydown);
    };
  }, []);
  useEffect(() => {
    dialog.current?.focus();
  }, [step]);
  const question = questions[step];
  const included = questions.filter(
    (_, index) => answers[index] === true,
  ).length;
  const decide = (include) => {
    setAnswers((prev) => ({ ...prev, [step]: include }));
    setStep(step + 1);
  };
  async function finish() {
    const result = {
      ...base,
      professionalSummary: "",
      contact: { email: "", phone: "", location: "" },
    };
    for (const section of resumeSections) result[section.key] = [];
    questions.forEach((q, index) => {
      if (answers[index] !== true) return;
      if (q.key === "professionalSummary") result.professionalSummary = q.item;
      else if (q.key === "contact") result.contact[q.field] = q.item;
      else result[q.key].push(q.item);
    });
    setError("");
    setSaving(true);
    try {
      await onApprove(result);
    } catch (error) {
      setError(error.message || "Approval could not be saved. Please retry.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-review-title"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="resume-review-title" className="text-xl font-bold">
          Review {outputName}
        </h2>
        {question ? (
          <div key={step} className="mt-4" aria-live="polite">
            <p className="text-sm text-slate-500">
              Question {step + 1} of {questions.length}
            </p>
            <h3 className="mt-2 text-lg font-semibold">{question.question}</h3>
            <div className="mt-3 break-words rounded-lg bg-slate-50 p-4">
              {typeof question.item === "string" ? (
                <p>{question.item}</p>
              ) : (
                Object.entries(question.item).map(
                  ([key, value]) =>
                    value && (
                      <p key={key}>
                        <span className="font-semibold">
                          {key.replace(/([A-Z])/g, " $1")}:{" "}
                        </span>
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </p>
                    ),
                )
              )}
            </div>
            {answers[step] !== undefined && (
              <p className="mt-2 text-sm">
                Previous answer: {answers[step] ? "Include" : "Skip"}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => decide(true)}>
                Yes, include
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => decide(false)}
              >
                No, skip
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="font-semibold">Review complete</h3>
            <p>
              {included} of {questions.length} details selected. Your name and
              target role remain included.
            </p>
            <ul className="mt-3 space-y-1">
              {resumeSections.map((section) => (
                <li key={section.key}>
                  {section.title}:{" "}
                  {
                    questions.filter(
                      (q, index) =>
                        q.key === section.key && answers[index] === true,
                    ).length
                  }
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              You can still edit your {outputName.toLowerCase()} afterward. Saving edits requires a
              new review.
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={saving}
              onClick={finish}
            >
              {saving ? "Saving approval…" : "Confirm approval"}
            </Button>
          </div>
        )}
        {error && (
          <p className="mt-3 text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel review
          </Button>
        </div>
      </section>
    </div>
  );
}
