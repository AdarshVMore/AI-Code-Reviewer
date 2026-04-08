import { Router } from "express";
import { allRepos, getSettings, repoAnalytics, updateSettings } from "../controllers/repo.controller.js";

const router = Router()

router.get("/get-all-repo", allRepos)

router.get("/all-analytics", repoAnalytics)

router.get("/get-settings", getSettings)

router.post("/update-settings", updateSettings)

export default router;
