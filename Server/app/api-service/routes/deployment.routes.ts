import { Router } from "express";
import { getDeployments, fixDeployment } from "../controllers/deployment.controller.js";
import { requireAuth } from "../auth/auth.js";

const router = Router();

router.get("/get-deployments/:repoId", requireAuth, getDeployments);
router.post("/fix/:id", requireAuth, fixDeployment);

export default router;
