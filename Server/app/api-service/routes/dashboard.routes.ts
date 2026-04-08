import { Router } from "express";
import { getAllData } from "../controllers/dashboard.controllers.js";
import { requireAuth } from "../auth/auth.js";

const router = Router()

router.get("/", requireAuth, getAllData)

export default router;
