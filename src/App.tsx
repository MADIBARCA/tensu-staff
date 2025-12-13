import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import { useI18n } from "@/i18n/i18n";
import StaffMainPage from "./pages/staff-pages/main/StaffMainPage";
import SchedulePage from "./pages/staff-pages/schedule/SchedulePage";
import ProfilePage from "./pages/staff-pages/profile/ProfilePage";
import StudentsPage from "./pages/staff-pages/students/StudentsPage";
import ManagementPage from "./pages/staff-pages/management/ManagementPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OnboardingPage from "./pages/onboarding/OnboardingPage";

function AppRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";

  return (
    <div className={isOnboarding ? "" : "pt-20"}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/staff/main" element={<StaffMainPage />} />
        <Route path="/staff/schedule" element={<SchedulePage />} />
        <Route path="/staff/students" element={<StudentsPage />} />
        <Route path="/staff/management" element={<ManagementPage />} />
        <Route path="/staff/profile" element={<ProfilePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/staff/main" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default function App() {
  const { lang } = useI18n();
  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      if (tg.isVersionAtLeast('7.7')) {
        tg.disableVerticalSwipes();
      }
    }
  }, []);

  return (
    <Router>
      <AppRoutes key={lang} />
    </Router>
  );
}
