import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfileManagement from "./pages/ProfileManagement";
import ProfileSources from "./pages/ProfileSources";
import ResumeBuilder from "./pages/ResumeBuilder";
import WebPortfolio from "./pages/WebPortfolio";
import InterviewPreparation from "./pages/InterviewPreparation";
import TokenManagement from "./pages/TokenManagement";
import AccessToken from "./pages/AccessToken";
import SharedProfile from "./pages/SharedProfile";
import EmployerDashboard from "./pages/EmployerDashboard";
import CompleteProfile from "./pages/Completeprofile";

import { onAuthChange } from "./services/authservice";
import { getProfile } from "./services/firestoreService";
import { isProfileComplete } from "./utils/profileValidation";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Employer / token routes should stay public */}
      <Route path="/access-token" element={<AccessToken />} />
      <Route path="/access-token/:tokenValue" element={<AccessToken />} />
      <Route path="/shared-profile/:userId" element={<SharedProfile />} />
      <Route path="/employer" element={<EmployerDashboard />} />

      {/* Protected job seeker routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileManagement />
          </RequireAuth>
        }
      />

      <Route
        path="/profile-sources"
        element={
          <RequireAuth>
            <ProfileSources />
          </RequireAuth>
        }
      />

      <Route
        path="/resume-builder"
        element={
          <RequireAuth>
            <ResumeBuilder />
          </RequireAuth>
        }
      />

      <Route
        path="/web-portfolio"
        element={
          <RequireAuth>
            <WebPortfolio />
          </RequireAuth>
        }
      />

      <Route
        path="/interview-preparation"
        element={
          <RequireAuth>
            <InterviewPreparation />
          </RequireAuth>
        }
      />

      <Route
        path="/token-management"
        element={
          <RequireAuth>
            <TokenManagement />
          </RequireAuth>
        }
      />

      <Route
        path="/complete-profile"
        element={
          <RequireAuth>
            <CompleteProfile />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }) {
  const location = useLocation();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [complete, setComplete] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [checkedPath, setCheckedPath] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => { setCheckedPath(null); setRevision(value => value + 1); };
    window.addEventListener('profile-saved', refresh);
    return () => window.removeEventListener('profile-saved', refresh);
  }, []);

  useEffect(() => {
    let active = true;
    let request = 0;
    const unsubscribe = onAuthChange(async (currentUser) => {
      const currentRequest = ++request;
      setCheckingAuth(true);
      setProfileError("");
      setUser(currentUser || null);
      try {
        const profile = currentUser ? await getProfile(currentUser.uid) : null;
        if (active && currentRequest === request) setComplete(isProfileComplete(profile));
      } catch {
        if (active && currentRequest === request) setProfileError("Unable to check your profile. Please retry to continue.");
      } finally {
        if (active && currentRequest === request) {
          setCheckedPath(location.pathname);
          setCheckingAuth(false);
        }
      }
    });

    return () => { active = false; unsubscribe(); };
  }, [location.pathname, revision]);

  if (checkingAuth || checkedPath !== location.pathname) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Checking your account...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileError) return <div className="grid min-h-screen place-content-center gap-4 bg-slate-50 p-6"><p role="alert">{profileError}</p><button onClick={() => setRevision(value => value + 1)}>Retry</button></div>;
  if (!complete && location.pathname !== '/complete-profile') return <Navigate to="/complete-profile" replace />;
  if (complete && location.pathname === '/complete-profile') return <Navigate to="/dashboard" replace />;

  return children;
}
