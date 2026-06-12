import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import StatusBadge from "../components/StatusBadge";
import { Upload, Link2, ExternalLink } from "lucide-react";

import { onAuthChange } from "../services/authService";
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
        status: value.trim() ? "Connected" : "Disconnected",
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

  const handleImportSource = (index) => {
    setSources((prev) => {
      const updatedSources = [...prev];

      updatedSources[index] = {
        ...updatedSources[index],
        status: "Imported",
      };

      return updatedSources;
    });
  };

  const handleSourceAction = (index) => {
    const source = sources[index];

    if (source.status === "Connected") {
      handleImportSource(index);
      return;
    }

    handleToggleSource(index);
  };

  const handleSaveSources = async () => {
    if (!userId) {
      alert("You must be logged in to save sources.");
      return;
    }

    setSaving(true);

    try {
      await saveProfileSources(userId, {
        sources,
        notes,
      });

      alert("Profile sources saved successfully!");
    } catch (error) {
      console.error("Error saving profile sources:", error);
      alert("Failed to save profile sources.");
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
                source.status === "Connected" || source.status === "Imported"
                  ? "primary"
                  : "outline"
              }
              onClick={() => handleSourceAction(index)}
              disabled={!source.url.trim()}
            >
              {source.status === "Imported" ? (
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