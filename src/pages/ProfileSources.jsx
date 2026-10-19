import { safeUrl } from '../utils/grounding';
import {
  isConnectedProfileSource,
  sourceUrlError,
  validateSourceUrl,
} from "../utils/sourceValidation";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";
import { Link2, ExternalLink, Unlink } from "lucide-react";
import Swal from "sweetalert2";
import { onAuthChange } from "../services/authservice";
import {
  getProfileSources,
  saveProfileSources,
} from "../services/firestoreService";

const defaultSources = [
  {
    name: "LinkedIn",
    status: "Disconnected",
    url: "",
    mark: "in",
  },
  {
    name: "GitHub",
    status: "Disconnected",
    url: "",
    mark: "GH",
  },
  {
    name: "Portfolio",
    status: "Disconnected",
    url: "",
    mark: "P",
  },
  {
    name: "Resume / CV",
    status: "Disconnected",
    url: "",
    mark: "CV",
  },
  {
    name: "Facebook",
    status: "Disconnected",
    url: "",
    mark: "FB",
  },
  {
    name: "Indeed",
    status: "Disconnected",
    url: "",
    mark: "IN",
  },
  {
    name: "JobStreet",
    status: "Disconnected",
    url: "",
    mark: "JS",
  },
  {
    name: "Personal Website",
    status: "Disconnected",
    url: "",
    mark: "WEB",
  },
];

export default function ProfileSources() {
  const lastSavedSnapshotRef = useRef("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [processingSource, setProcessingSource] = useState(null);
  const [sources, setSources] = useState(defaultSources);

  const profileLinks = useMemo(() => {
    return sources.filter(isConnectedProfileSource);
  }, [sources]);

  const sourceErrors = useMemo(
    () => sources.map((source) => sourceUrlError(source)),
    [sources],
  );

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedSources = await getProfileSources(user.uid);

        const normalizedSources = savedSources
          ? normalizeSavedSources(savedSources.sources)
          : defaultSources;

        setSources(normalizedSources);
        lastSavedSnapshotRef.current = JSON.stringify(
          normalizeSourcesForSave(normalizedSources)
        );
      } catch (error) {
        console.error("Error fetching profile sources:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || loading) return undefined;

    const sourcesToSave = normalizeSourcesForSave(sources);
    const nextSnapshot = JSON.stringify(sourcesToSave);

    if (nextSnapshot === lastSavedSnapshotRef.current) {
      return undefined;
    }

    setSaving(true);
    setSaveStatus("Saving...");

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveProfileSources(userId, {
          sources: sourcesToSave,
          notes: "",
        });

        lastSavedSnapshotRef.current = nextSnapshot;
        setSaveStatus("Saved");
      } catch (error) {
        console.error("Auto-save profile sources error:", error);
        setSaveStatus("Unable to save");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [sources, userId, loading]);

  const handleSourceUrlChange = (index, value) => {
    setSources((prev) => {
      const updatedSources = [...prev];

      updatedSources[index] = {
        ...updatedSources[index],
        url: value,
        status: value.trim() ? "Pending" : "Disconnected",
      };

      return updatedSources;
    });
  };

  const handleSourceAction = async (index) => {
    const source = sources[index];
    const validation = validateSourceUrl(source.name, source.url);
    if (!validation.valid) {
      Swal.fire({
        icon: "error",
        title: "Invalid source link",
        text: validation.error || "Enter a valid source URL.",
      });
      return;
    }

    // If pending → connect first
    if (!["Connected", "Imported"].includes(source.status)) {
      setProcessingSource(index);

      try {
        // simulate validation / API check

        setSources((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            url: validation.url,
            status: "Connected",
          };
          return updated;
        });

        Swal.fire({
          icon: "success",
          title: "Link saved",
          text: `${source.name} link saved. Its contents have not been fetched or verified.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } finally {
        setProcessingSource(null);
      }

      return;
    }

    // If connected → import
    // If imported → disconnect confirmation
    const result = await Swal.fire({
      title: "Disconnect?",
      text: `Stop sharing ${source.name} as a connected profile source?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, disconnect",
    });

    if (!result.isConfirmed) return;

    setSources((prev) => {
      const updated = [...prev];
      updated[index].status = "Disconnected";
      updated[index].url = "";
      return updated;
    });
  };

      // mark only pending → connected
  if (loading) {
    return (
      <AppLayout title="Profile Source Input">
        <p>Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Profile Source Input"
      subtitle="Add and manage your external professional sources"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sources.map((source, index) => (
          <Card key={source.name}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 font-extrabold text-forge">
                  {source.mark}
                </div>

                <h3 className="font-extrabold text-ink">{source.name}</h3>
              </div>

              <StatusBadge status={source.status} />
            </div>

            <FormField
              label="Profile URL"
              value={source.url}
              onChange={(e) => handleSourceUrlChange(index, e.target.value)}
              placeholder={`Enter your ${source.name} URL`}
              error={sourceErrors[index]}
            />

            <Button
              className="mt-4 w-full"
              variant={
                ["Connected", "Imported"].includes(source.status)
                  ? "secondary"
                  : "outline"
              }
              onClick={() => handleSourceAction(index)}
              disabled={
                !source.url.trim() ||
                Boolean(sourceErrors[index]) ||
                processingSource === index
              }
            >
              {processingSource === index ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : ["Connected", "Imported"].includes(source.status) ? (
                <>
                  <Unlink size={16} /> Disconnect
                </>
              ) : (
                <>
                  <Link2 size={16} /> Connect
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>

      <Card
        className="mt-5"
        title="Connected Profile Sources"
        right={
          saveStatus ? (
            <span className={`text-xs font-bold ${saveStatus === "Unable to save" ? "text-red-600" : "text-slate-500"}`}>
              {saving ? "Saving..." : saveStatus}
            </span>
          ) : null
        }
      >
        {profileLinks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No connected profile sources yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profileLinks.map((source) => (
              <a
                key={source.name}
                href={safeUrl(source.url) || undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-forge hover:bg-blue-50"
              >
                {source.name}
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        )}
      </Card>

    </AppLayout>
  );
}

function normalizeSourcesForSave(sources) {
  return sources.map((source) => {
    const validation = validateSourceUrl(source.name, source.url);
    return {
      ...source,
      url: validation.valid ? validation.url : "",
      status: validation.valid ? source.status : "Disconnected",
    };
  });
}

function normalizeSavedSources(savedSources) {
  if (!Array.isArray(savedSources)) return defaultSources;

  return defaultSources.map((defaultSource) => {
    const savedSource = savedSources.find(
      (source) => source.name === defaultSource.name
    );

    if (!savedSource) return defaultSource;

    const validation = validateSourceUrl(
      defaultSource.name,
      savedSource.url || "",
    );
    const url = validation.valid ? validation.url : "";

    const savedStatus = ["Pending", "Connected", "Imported"].includes(
      savedSource.status
    )
      ? savedSource.status
      : "Connected";

    return {
      ...defaultSource,
      ...savedSource,
      url,
      status: url.trim() ? savedStatus : "Disconnected",
    };
  });
}

function formatUrl(url) {
  if (!url) return "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}
