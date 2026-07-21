import {Router} from "express"
import { getPRInfo, getAllPRs } from "../controllers/pr.controller.js"
import { getCollaboratorAnalysis, getCollaborators } from "../controllers/collaborators.controller.js"
import { applyIssueFixHandler } from "../controllers/issueFix.controller.js"
import { requireAuth } from "../auth/auth.js"

const router = Router()

router.get("/get-pr-info/:repoId/:id", requireAuth, getPRInfo)
router.get("/get-all-prs/:id", requireAuth, getAllPRs)
router.get("/collaborators/:id", requireAuth, getCollaborators)
router.get("/collaborators-analysis/:id/:collaborator", requireAuth, getCollaboratorAnalysis)
router.post("/issues/:issueId/apply-fix", requireAuth, applyIssueFixHandler)

export default router;
