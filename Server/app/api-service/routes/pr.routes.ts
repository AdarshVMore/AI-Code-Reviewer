import {Router} from "express"
import { getPRInfo, getAllPRs } from "../controllers/pr.controller.js"
import { getCollaborators } from "../controllers/collaborators.controller.js"
import { requireAuth } from "../auth/auth.js"

const router = Router()

router.get("/get-pr-info/:repoId/:id", requireAuth, getPRInfo)
router.get("/get-all-prs/:id", requireAuth, getAllPRs)
router.get("/collaborators/:id", requireAuth, getCollaborators)

export default router;
