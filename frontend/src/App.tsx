import { Navigate, Route, Routes } from "react-router-dom";
import { PublicShell } from "./layout/PublicShell";
import { HomePage } from "./pages/HomePage";
import { JoinPage } from "./pages/JoinPage";
import { MembersPage } from "./pages/MembersPage";
import { OpenSourcePage } from "./pages/OpenSourcePage";
import { HistoryPage } from "./pages/HistoryPage";
import { GroupRulesPage } from "./pages/GroupRulesPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminSiteSettings } from "./pages/admin/AdminSiteSettings";
import { AdminCards } from "./pages/admin/AdminCards";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminServerHistory } from "./pages/admin/AdminServerHistory";
import { AdminTeamMembers } from "./pages/admin/AdminTeamMembers";
import { AdminOpenSource } from "./pages/admin/AdminOpenSource";
import { AdminAnnouncements } from "./pages/admin/AdminAnnouncements";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicShell />}>
        <Route index element={<HomePage />} />
        <Route path="join" element={<JoinPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="open-source" element={<OpenSourcePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="rules" element={<GroupRulesPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="site" element={<AdminSiteSettings />} />
        <Route path="cards" element={<AdminCards />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="server-history" element={<AdminServerHistory />} />
        <Route path="members" element={<AdminTeamMembers />} />
        <Route path="open-source" element={<AdminOpenSource />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
