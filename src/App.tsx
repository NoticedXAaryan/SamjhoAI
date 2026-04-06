import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import MeetingPage from './pages/MeetingPage';
import DownloadPage from './pages/DownloadPage';
import DashboardPage from './pages/DashboardPage';
import { CursorGlow, NoiseOverlay } from './components/ui/Effects';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NoiseOverlay />
        <CursorGlow />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e1e24',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '14px',
              fontSize: '14px',
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}
