import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { onAuthChange } from "../services/authService";
import { getProfile } from "../services/firestoreService";

export default function TopBar({ title, subtitle, badge, employer = false }) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(!employer);

  useEffect(() => {
    if (employer) {
      setProfile({
        fullName: "Employer Viewer",
        targetRole: "HR / Recruiter Access",
      });
      setProfileLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        const profileData = await getProfile(user.uid);

        setProfile({
          fullName: profileData?.fullName || user.displayName || "User",
          targetRole: profileData?.targetRole || "ICT Job Seeker",
          imgUrl: profileData?.imgUrl || "",
        });
      } catch (error) {
        console.error("TopBar profile error:", error);

        setProfile({
          fullName: user.displayName || "User",
          targetRole: "ICT Job Seeker",
          imgUrl: "",
        });
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, [employer]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{title}</h1>

            {(badge || employer) && (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-forge">
                {badge || "Employer View"}
              </span>
            )}
          </div>

          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {!employer && (
            <button
              type="button"
              className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={18} />
            </button>
          )}

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            {profile?.imgUrl ? (
              <img
                src={profile.imgUrl}
                alt={profile.fullName || "Profile"}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xl">
                {employer ? "🏢" : "👨‍💻"}
              </div>
            )}

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-ink">
                {profileLoading
                  ? "Loading..."
                  : profile?.fullName || (employer ? "Employer Viewer" : "User")}
              </p>

              <p className="text-xs text-slate-500">
                {profileLoading
                  ? "Please wait..."
                  : profile?.targetRole ||
                    (employer ? "HR / Recruiter Access" : "ICT Job Seeker")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}