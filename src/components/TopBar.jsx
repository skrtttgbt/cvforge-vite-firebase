import { Bell } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import ProfileAvatar from './ProfileAvatar';
import { profilePhoto } from '../utils/profilePhoto';

export default function TopBar({ title, subtitle, badge, employer = false }) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const profileLoading = !employer && loading;
  const profile = employer ? { fullName:'Employer Viewer', targetRole:'HR / Recruiter Access' } : {
    fullName: userProfile?.fullName || firebaseUser?.displayName || 'User',
    targetRole: userProfile?.targetRole || 'ICT Job Seeker',
    imgUrl: profilePhoto(userProfile, firebaseUser),
  };

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
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            { !employer ? (
              <ProfileAvatar
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
