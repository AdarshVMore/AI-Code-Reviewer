import { Router } from "express";
import { allRepos, getSettings, repoAnalytics, updateSettings } from "../controllers/repo.controller.js";
import { requireAuth } from "../auth/auth.js";

const router = Router()

router.get("/get-all-repo", requireAuth, allRepos)

router.get("/all-analytics",requireAuth, repoAnalytics)

router.get("/get-settings",requireAuth, getSettings)

router.put("/update-settings",requireAuth, updateSettings)

export default router;
 