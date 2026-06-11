import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { onAuthChange } from "../services/authService";
import { getProfile } from "../services/firestoreService";

export default function TopBar({ title, subtitle, badge }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const profileData = await getProfile(user.uid);

        setProfile({
          fullName: profileData?.fullName || user.displayName || "User",
          targetRole: profileData?.targetRole || "ICT Job Seeker",
        });
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{title}</h1>

            {badge && (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-forge">
                {badge}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            {profile?.imgUrl ? (
              <img
                src={profile.imgUrl}
                alt={profile.fullName || "Profile"}
                className="h-10 w-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-xl">
                👨‍💻
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-ink">
                {profile?.fullName || "Loading..."}
              </p>

              <p className="text-xs text-slate-500">
                {profile?.targetRole || "ICT Job Seeker"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
