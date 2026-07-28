import { Router } from "express";
import { getAllData } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../auth/auth.js";

const router = Router()

router.get("/", requireAuth, getAllData)

export default router;
