import {Router} from "express"
import { getPRInfo } from "../controllers/pr.controller.js"

const router = Router()

router.get("/get-pr-info/:id", getPRInfo)

export default router;
