import { Router } from "express";
import { requireAuth } from "../auth/auth.js";
import { addApiKey, deleteApiKey, getAIUsage } from "../controllers/aiUsage.controller.js";

const router = Router();

router.get("/", requireAuth, getAIUsage);
router.post("/keys", requireAuth, addApiKey);
router.delete("/keys/:id", requireAuth, deleteApiKey);

export default router;
