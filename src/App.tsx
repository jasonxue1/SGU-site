import { Navigate, Route, Routes } from "react-router-dom";
import { PublicShell } from "./layout/PublicShell";
import { GroupRulesPage } from "./pages/GroupRulesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { JoinPage } from "./pages/JoinPage";
import { MembersPage } from "./pages/MembersPage";
import { OpenSourcePage } from "./pages/OpenSourcePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicShell />}>
        <Route index element={<HomePage />} />
        <Route path="join" element={<JoinPage />} />
        <Route path="rules" element={<GroupRulesPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="open-source" element={<OpenSourcePage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
