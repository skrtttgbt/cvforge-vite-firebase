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
import CompleteProfile from "./pages/CompleteProfile";

import { onAuthChange } from "./services/authService";

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

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser || null);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Checking login...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}