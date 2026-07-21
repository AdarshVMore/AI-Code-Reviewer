import { Router } from "express";
import { applyIssueFixHandler } from "../controllers/issueFix.controller.js";
import { requireAuth } from "../auth/auth.js";

const router = Router();

router.post("/issues/:issueId/apply-fix", requireAuth, applyIssueFixHandler);

export default router;
