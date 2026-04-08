import { Router } from "express";
import { getAllData } from "../controllers/dashboard.controllers.js";

const router = Router()

router.get("/", getAllData)

export default router;
