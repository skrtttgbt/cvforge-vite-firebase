import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProfileManagement from './pages/ProfileManagement'
import ProfileSources from './pages/ProfileSources'
import ResumeBuilder from './pages/ResumeBuilder'
import WebPortfolio from './pages/WebPortfolio'
import InterviewPreparation from './pages/InterviewPreparation'
import TokenManagement from './pages/TokenManagement'
import AccessToken from './pages/AccessToken'
import SharedProfile from './pages/SharedProfile'
import EmployerDashboard from './pages/EmployerDashboard'
import CompleteProfile from './pages/CompleteProfile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<ProfileManagement />} />
      <Route path="/profile-sources" element={<ProfileSources />} />
      <Route path="/resume-builder" element={<ResumeBuilder />} />
      <Route path="/web-portfolio" element={<WebPortfolio />} />
      <Route path="/interview-preparation" element={<InterviewPreparation />} />
      <Route path="/token-management" element={<TokenManagement />} />
      <Route path="/access-token" element={<AccessToken />} />
      <Route path="/shared-profile" element={<SharedProfile />} />
      <Route path="/employer" element={<EmployerDashboard />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
    </Routes>
  )
}
