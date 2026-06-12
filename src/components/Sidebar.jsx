import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Home,
  User,
  Link2,
  FilePenLine,
  Monitor,
  Clock,
  ShieldCheck,
  LogOut,
  Users,
} from "lucide-react";
import Logo from "./Logo";

const seekerLinks = [
  ["Dashboard", "/dashboard", Home],
  ["Profile Management", "/profile", User],
  ["Profile Sources", "/profile-sources", Link2],
  ["AI Resume Builder", "/resume-builder", FilePenLine],
  ["Web Portfolio", "/web-portfolio", Monitor],
  ["Interview Preparation", "/interview-preparation", Clock],
  ["Token Management", "/token-management", ShieldCheck],
];

export default function Sidebar({ employer = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, ownerId } = useParams();

  const candidateId = userId || ownerId;

  const currentSharedProfilePath = candidateId
    ? `/shared-profile/${candidateId}`
    : "";

  if (currentSharedProfilePath) {
    localStorage.setItem("lastCandidateViewPath", currentSharedProfilePath);
  }

  const lastCandidateViewPath =
    localStorage.getItem("lastCandidateViewPath") || "";

  const employerLinks = [
    ["Dashboard", "/employer", Home],
    ["Candidate View", currentSharedProfilePath || lastCandidateViewPath, Users],
  ];

  const links = employer ? employerLinks : seekerLinks;

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import("../services/authService");

      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout.");
    }
  };

  const handleBackToLogin = () => {
    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-gradient-to-b from-navy to-navy2 text-white lg:flex">
      <div className="px-7 py-6">
        <Logo dark />
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {links.map(([label, to, Icon]) => {
          const isDisabled = employer && label === "Candidate View" && !to;

          if (isDisabled) {
            return (
              <button
                key={label}
                type="button"
                disabled
                title="Open a candidate profile first."
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-blue-100/40"
              >
                <Icon size={18} />
                {label}
              </button>
            );
          }

          return (
            <NavLink
              key={`${label}-${to}`}
              to={to}
              end={to === "/employer" || to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-forge text-white"
                    : "text-blue-100 hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-4 py-5">
        {employer ? (
          <button
            type="button"
            onClick={handleBackToLogin}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-blue-100 transition hover:bg-white/10"
          >
            <LogOut size={18} />
            Back to Login
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-blue-100 transition hover:bg-white/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}