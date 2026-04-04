/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import MeetingPage from './pages/MeetingPage';
import DownloadPage from './pages/DownloadPage';
import DashboardPage from './pages/DashboardPage';
import { CursorGlow, NoiseOverlay } from './components/ui/Effects';

export default function App() {
  return (
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
    </Router>
  );
}
