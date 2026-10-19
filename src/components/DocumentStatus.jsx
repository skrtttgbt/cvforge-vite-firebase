import {
  CheckCircle2,
  CircleDashed,
  CloudOff,
  CloudUpload,
  FileClock,
  Globe2,
  LockKeyhole,
} from "lucide-react";

export default function DocumentStatus({
  label,
  exists,
  approvalStatus,
  saved,
  visibility,
}) {
  const approved = exists && approvalStatus === "approved";
  const PrimaryIcon = approved ? CheckCircle2 : exists ? FileClock : CircleDashed;
  const primaryLabel = approved
    ? `Approved ${label}`
    : exists
      ? `${label} draft`
      : `No ${label.toLowerCase()} generated`;

  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${approved ? "bg-emerald-50 text-emerald-700" : exists ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
        >
          <PrimaryIcon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">Document status</p>
          <p className="truncate font-bold text-ink">{primaryLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <StatusItem
          Icon={saved ? CloudUpload : CloudOff}
          label="Save state"
          value={!exists ? "Not saved" : saved ? "All changes saved" : "Unsaved changes"}
          tone={exists && !saved ? "warning" : "neutral"}
        />
        {visibility && (
          <StatusItem
            Icon={visibility === "public" ? Globe2 : LockKeyhole}
            label="Visibility"
            value={visibility === "public" ? "Public" : "Private"}
            tone={visibility === "public" ? "success" : "neutral"}
          />
        )}
      </div>
    </div>
  );
}

function StatusItem({ Icon, label, value, tone }) {
  const color =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-600";
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon size={16} aria-hidden="true" />
      <span>
        <span className="block text-[10px] font-semibold uppercase text-slate-400">{label}</span>
        <span className="font-semibold">{value}</span>
      </span>
    </div>
  );
}
