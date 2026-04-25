import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { adminSettingsRouter } from "./settings.js";
import { adminCardsRouter } from "./cards.js";
import { adminUsersRouter } from "./users.js";
import { adminUploadRouter } from "./upload.js";
import { adminServerHistoryRouter } from "./serverHistory.js";
import { adminTeamMembersRouter } from "./teamMembers.js";
import { adminOpenSourceProjectsRouter } from "./openSourceProjects.js";
import { adminAnnouncementsRouter } from "./announcements.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);
adminRouter.use("/settings", adminSettingsRouter);
adminRouter.use("/cards", adminCardsRouter);
adminRouter.use("/server-history", adminServerHistoryRouter);
adminRouter.use("/members", adminTeamMembersRouter);
adminRouter.use("/open-source", adminOpenSourceProjectsRouter);
adminRouter.use("/announcements", adminAnnouncementsRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/upload", adminUploadRouter);
