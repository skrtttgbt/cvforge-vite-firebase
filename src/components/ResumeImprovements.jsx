import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import FormField from "./FormField";
import { profileSelections } from "../utils/resumeSuggestions";

const prompt = (suggestion) =>
  suggestion.type === "skill"
    ? "Do you want to add this skill?"
    : suggestion.type === "summary"
      ? "Would you like to use this professional summary?"
      : `Would you like to use this ${suggestion.type} description?`;
export default function ResumeImprovements({
  suggestions,
  notice,
  onGenerate,
  onSaveProfile,
  onCancel,
}) {
  const [items, setItems] = useState(() => structuredClone(suggestions));
  const [step, setStep] = useState(0),
    [stage, setStage] = useState("intro");
  const [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef(null),
    busyRef = useRef(false),
    cancel = useRef(onCancel);
  busyRef.current = busy;
  cancel.current = onCancel;
  useEffect(() => {
    const trigger = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keydown(event) {
      if (event.key === "Escape" && !busyRef.current) cancel.current();
      if (event.key === "Tab") {
        const controls = [
          ...dialog.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),textarea:not(:disabled)",
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
          [first, dialog.current].includes(document.activeElement)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          [last, dialog.current].includes(document.activeElement)
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
  }, [step, stage]);
  const item = items[step],
    selected = profileSelections(items),
    approved = items.filter((item) => item.status === "approved");
  function update(patch) {
    setItems((previous) =>
      previous.map((item, index) =>
        index === step ? { ...item, ...patch } : item,
      ),
    );
  }
  function decide(status) {
    update({
      status,
      ...(status === "declined" ? { addToProfile: false } : {}),
    });
    setEditing(false);
    if (step + 1 < items.length) setStep(step + 1);
    else setStage("done");
  }
  async function generate(save = false) {
    setError("");
    setBusy(true);
    try {
      if (save && !saved) {
        await onSaveProfile(items);
        setSaved(true);
      }
      await onGenerate(items);
    } catch (error) {
      setError(error.message || "Could not continue. Please retry.");
      setStage("done");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="improvement-title"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="improvement-title" className="text-xl font-bold">
          Resume Improvement Questions
        </h2>
        {stage === "intro" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold">AI Suggested Skills</h3>
              <p className="mt-2 text-sm">
                Only add or approve these skills if you actually have knowledge
                or experience using them. These are suggestions based on your
                target role and are not automatically considered part of your
                qualifications.
              </p>
            </div>
            {notice && <p className="text-sm text-slate-600">{notice}</p>}
            <p className="text-sm">
              Approving a suggestion uses it in this resume. Adding it to your
              profile is a separate, optional choice and requires confirmation.
            </p>
            <Button
              type="button"
              onClick={() => setStage(items.length ? "question" : "done")}
            >
              Start questions
            </Button>
          </div>
        )}
        {stage === "question" && item && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Question {step + 1} of {items.length}
            </p>
            <h3 className="font-semibold">{prompt(item)}</h3>
            {item.type === "skill" && (
              <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                Add these skills only if you actually have them.
              </p>
            )}
            {item.original && (
              <p className="text-sm font-semibold">
                {item.original.projectTitle ||
                  [item.original.jobTitle, item.original.companyName]
                    .filter(Boolean)
                    .join(" — ")}
              </p>
            )}
            {item.type === 'summary' && item.originalSummary && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold">Current professional summary</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{item.originalSummary}</p>
              </div>
            )}
            {item.type === 'summary' && <p className="text-sm font-semibold">{item.source === 'ai-suggestion' ? 'AI-suggested professional summary' : 'Suggested professional summary (profile-based wording)'}</p>}
            {editing ? (
              <label className="block text-sm font-semibold">
                Suggested wording
                <textarea
                  className="mt-2 min-h-32 w-full rounded border p-3"
                  maxLength={20000}
                  value={item.value}
                  onChange={(event) =>
                    update({ value: event.target.value, status: "pending" })
                  }
                />
              </label>
            ) : (
              <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4">
                {item.value}
              </p>
            )}
            {item.source === "profile" && (
              <p className="text-xs text-slate-500">
                This wording comes from your profile. You can edit it before
                approving.
              </p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.addToProfile}
                onChange={(event) =>
                  update({ addToProfile: event.target.checked })
                }
              />
              <span>
                {item.type === "summary"
                  ? "Save approved summary to my profile"
                  : item.type === "skill"
                    ? "Add this to my profile"
                    : "Update this description in my profile"}
              </span>
            </label>
            {item.type === "skill" && item.addToProfile && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Skill category"
                  maxLength={100}
                  value={item.category || ""}
                  onChange={(event) => update({ category: event.target.value })}
                  placeholder="e.g. Web Development"
                />
                <FormField
                  label="Your proficiency level"
                  as="select"
                  value={item.proficiencyLevel || ""}
                  onChange={(event) =>
                    update({ proficiencyLevel: event.target.value })
                  }
                >
                  <option value="">Choose your level</option>
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map(
                    (level) => (
                      <option key={level}>{level}</option>
                    ),
                  )}
                </FormField>
              </div>
            )}
            {item.status !== "pending" && (
              <p className="text-sm">Previous decision: {item.status}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={
                  !item.value.trim() ||
                  (item.type === "skill" &&
                    item.addToProfile &&
                    (!item.category?.trim() || !item.proficiencyLevel))
                }
                onClick={() => decide("approved")}
              >
                Approve
              </Button>
              {item.type !== "skill" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? "Preview wording" : "Edit"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => decide("declined")}
              >
                Decline
              </Button>
            </div>
          </div>
        )}
        {stage === "done" && (
          <div className="mt-4 space-y-3">
            <h3 className="font-semibold">Suggestions reviewed</h3>
            <p>{approved.length} suggestions approved for this resume.</p>
            {saved ? (
              <p role="status">
                Selected suggestions were saved to your profile. Resume
                generation can be retried without saving them again.
              </p>
            ) : (
              <p>
                {selected.length} approved suggestions selected for profile
                changes.
              </p>
            )}
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                selected.length && !saved
                  ? setStage("confirm")
                  : generate(false)
              }
            >
              {busy ? "Generating draft…" : "Generate Resume Draft"}
            </Button>
            {selected.length > 0 && !saved && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => generate(false)}
              >
                Use in resume only
              </Button>
            )}
          </div>
        )}
        {stage === "confirm" && (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-semibold">
              Add AI Suggestions to Profile?
            </h3>
            <p>
              The following approved information will be saved to your profile:
            </p>
            <ul className="space-y-3">
              {selected.map((item) => (
                <li
                  key={item.id}
                  className="break-words rounded bg-slate-50 p-3"
                >
                  <strong>
                    {item.type === "skill"
                      ? "Skill"
                      : item.type === "summary"
                        ? "Professional Summary"
                        : `${item.type === "project" ? "Project" : "Experience"} description`}
                  </strong>
                  <p className="whitespace-pre-wrap">{item.value}</p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              Existing project and experience records are updated only at their
              matching entries. Duplicate skills are not added.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setStage("done")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => generate(true)}
              >
                {busy ? "Saving and generating…" : "Save to Profile"}
              </Button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-red-600">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
          {["question", "done"].includes(stage) && items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={busy || saved || (stage === "question" && step === 0)}
              onClick={() => {
                if (stage === "done") {
                  setStep(items.length - 1);
                  setStage("question");
                } else setStep(step - 1);
                setEditing(false);
              }}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel improvements
          </Button>
        </div>
      </section>
    </div>
  );
}
