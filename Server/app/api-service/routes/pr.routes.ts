import {Router} from "express"
import { getPRInfo, getAllPRs } from "../controllers/pr.controller.js"
import { requireAuth } from "../auth/auth.js"

const router = Router()

router.get("/get-pr-info/:repoId/:id", requireAuth, getPRInfo)
router.get("/get-all-prs/:id", requireAuth, getAllPRs)

export default router;
