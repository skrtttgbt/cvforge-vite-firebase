import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";
import { Upload, Link2, ExternalLink } from "lucide-react";
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
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingSource, setProcessingSource] = useState(null);
  const [sources, setSources] = useState(defaultSources);
  const [notes, setNotes] = useState("");

  const profileLinks = useMemo(() => {
    return sources.filter((source) => source.url && source.url.trim());
  }, [sources]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedSources = await getProfileSources(user.uid);

        if (savedSources) {
          setSources(normalizeSavedSources(savedSources.sources));
          setNotes(savedSources.notes || "");
        }
      } catch (error) {
        console.error("Error fetching profile sources:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleToggleSource = (index) => {
    setSources((prev) => {
      const updatedSources = [...prev];
      const source = updatedSources[index];

      updatedSources[index] = {
        ...source,
        status:
          source.status === "Connected" || source.status === "Imported"
            ? "Disconnected"
            : "Connected",
      };

      return updatedSources;
    });
  };

  const handleImportSource = async (index) => {
    try {
      setProcessingSource(index);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSources((prev) => {
        const updated = [...prev];

        updated[index] = {
          ...updated[index],
          status: "Imported",
        };

        return updated;
      });

      Swal.fire({
        icon: "success",
        title: "Imported",
        text: "Profile data imported successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setProcessingSource(null);
    }
  };

  const handleSourceAction = async (index) => {
    const source = sources[index];

    // If pending → connect first
    if (source.status === "Pending") {
      setProcessingSource(index);

      try {
        // simulate validation / API check
        await new Promise((r) => setTimeout(r, 1000));

        setSources((prev) => {
          const updated = [...prev];
          updated[index].status = "Connected";
          return updated;
        });

        Swal.fire({
          icon: "success",
          title: "Link Verified",
          text: `${source.name} is now connected.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } finally {
        setProcessingSource(null);
      }

      return;
    }

    // If connected → import
    if (source.status === "Connected") {
      await handleImportSource(index);
      return;
    }

    // If imported → disconnect confirmation
    const result = await Swal.fire({
      title: "Disconnect?",
      text: `Remove ${source.name}?`,
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

  const handleSaveSources = async () => {
    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "You must be logged in to save sources.",
      });
      return;
    }

    // get only pending sources
    const pendingSources = sources.filter((s) => s.status === "Pending");

    if (pendingSources.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Nothing to Save",
        text: "No new links to confirm.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Sources",
      html: `
        <p>You are about to save the following:</p>
        <ul style="text-align:left;margin-top:10px;">
          ${pendingSources
            .map((s) => `<li><b>${s.name}</b></li>`)
            .join("")}
        </ul>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm Save",
    });

    if (!result.isConfirmed) return;

    setSaving(true);

    try {
      // simulate save
      await saveProfileSources(userId, {
        sources,
        notes,
      });

      // mark only pending → connected
      setSources((prev) =>
        prev.map((s) =>
          s.status === "Pending"
            ? { ...s, status: "Connected" }
            : s
        )
      );

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your profile sources have been confirmed.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: "Failed to save profile sources.",
      });
    }

    setSaving(false);
  };

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
            />

            <Button
              className="mt-4 w-full"
              variant={
                source.status === "Imported"
                  ? "primary"
                  : source.status === "Connected"
                  ? "secondary"
                  : "outline"
              }
              onClick={() => handleSourceAction(index)}
              disabled={!source.url.trim() || processingSource === index}
            >
              {processingSource === index ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : source.status === "Imported" ? (
                "Imported"
              ) : source.status === "Connected" ? (
                <>
                  <Upload size={16} /> Import
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

      <Card className="mt-5" title="Profile Links">
        {profileLinks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No profile links added yet. Add a URL above to show it here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profileLinks.map((source) => (
              <a
                key={source.name}
                href={formatUrl(source.url)}
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

      <Card className="mt-5" title="Additional Notes / Imported Content">
        <FormField
          label=""
          as="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes, context, or paste imported content here..."
        />

        <div className="mt-4">
          <Button onClick={handleSaveSources} disabled={saving}>
            {saving ? "Saving..." : "Save Sources"}
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}

function normalizeSavedSources(savedSources) {
  if (!Array.isArray(savedSources)) return defaultSources;

  return defaultSources.map((defaultSource) => {
    const savedSource = savedSources.find(
      (source) => source.name === defaultSource.name
    );

    if (!savedSource) return defaultSource;

    const url = savedSource.url || "";

    return {
      ...defaultSource,
      ...savedSource,
      url,
      status: url.trim()
        ? savedSource.status === "Imported"
          ? "Imported"
          : "Connected"
        : "Disconnected",
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