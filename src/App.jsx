import { useAuth } from "./contexts/AuthContext";
import LoadingSkeleton from "./components/LoadingSkeleton";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfileManagement from "./pages/ProfileManagement";
import ProfileSources from "./pages/ProfileSources";
import ResumeBuilder from "./pages/ResumeBuilder";
import WebPortfolio from "./pages/WebPortfolio";
import EmployerOutput from './pages/EmployerOutput';
import PublicPortfolio from "./pages/PublicPortfolio";
import InterviewPreparation from "./pages/InterviewPreparation";
import TokenManagement from "./pages/TokenManagement";
import AccessToken from "./pages/AccessToken";
import SharedProfile from "./pages/SharedProfile";
import CompleteProfile from "./pages/Completeprofile";
import ForgetPassword from "./pages/ForgetPassword";
import { isProfileComplete } from "./utils/profileValidation";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <>
      <RouteAccessibility />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />

        {/* Employer / token routes should stay public */}
        <Route path="/access-token" element={<AccessToken />} />
        <Route path="/access-token/:tokenValue" element={<AccessToken />} />
        <Route path="/shared-profile/:tokenValue" element={<SharedProfile />} />
        <Route path="/employer-dashboard/:tokenValue" element={<SharedProfile />} />
        <Route path="/employer-view/:tokenValue/:outputType" element={<EmployerOutput />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolio />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/p/:slug" element={<PublicPortfolio />} />

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

        <Route
          path="*"
          element={
            <main id="main-content" tabIndex={-1} className="p-8">
              <h1>404</h1>
              <h2>Page not found</h2>
              <p>The requested page does not exist.</p>
              <a href="/">Return Home</a>
            </main>
          }
        />
      </Routes>
    </>
  );
}

function RequireAuth({ children }) {
  const location = useLocation();
  const { firebaseUser, userProfile, loading, error } = useAuth();
  if (loading)
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl p-6">
        <LoadingSkeleton />
      </main>
    );
  if (error)
    return (
      <main id="main-content" tabIndex={-1} className="p-6">
        <p role="alert">{error}</p>
        <button
          onClick={() => firebaseUser ? window.dispatchEvent(new Event("profile-saved")) : window.location.reload()}
        >
          Retry
        </button>
      </main>
    );
  if (!firebaseUser)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const complete = isProfileComplete(userProfile);
  if (!complete && location.pathname !== "/complete-profile")
    return <Navigate to="/complete-profile" replace />;
  if (complete && location.pathname === "/complete-profile")
    return <Navigate to="/dashboard" replace />;
  return children;
}

function RouteAccessibility() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles = {
      "/": "Sign In",
      "/dashboard": "Dashboard",
      "/profile": "Profile",
      "/resume-builder": "Resume Builder",
      "/web-portfolio": "Portfolio",
      "/interview-preparation": "Interview Preparation",
      "/token-management": "Token Management",
      "/privacy": "Privacy Policy",
      "/login": "Sign In",
      "/register": "Register",
      "/complete-profile": "Complete Profile",
      "/profile-sources": "Profile Sources",
      "/forgot-password": "Reset Password",
    };
    document.title =
      (titles[pathname] ||
        (/^\/employer-view(\/|$)/.test(pathname) ? 'Shared Candidate Output' : /^\/(employer-dashboard|shared-profile)(\/|$)/.test(pathname) ? 'Employer / HR Dashboard' : /^\/access-token(\/|$)/.test(pathname) ? 'Employer Token Access' : /^\/(p|portfolio)(\/|$)/.test(pathname)
          ? "Shared Portfolio"
          : "Page not found")) + " | CVForge";
    const main = document.querySelector("main");
    if (main) {
      main.id = "main-content";
      main.tabIndex = -1;
    }
  }, [pathname]);
  return null;
}
