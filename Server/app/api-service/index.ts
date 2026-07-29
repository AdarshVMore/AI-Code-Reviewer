import "dotenv/config";
import express from "express";
import cors from 'cors';

import dashboardRoutes from "./routes/dashboard.routes.js"
import repoRoutes from "./routes/repos.route.js"
import prRoutes from "./routes/pr.routes.js"
import userRoutes from "./routes/user.routes.js"
import deploymentRoutes from "./routes/deployment.routes.js"
import aiUsageRoutes from "./routes/aiUsage.routes.js"
import issueFixRoutes from "./routes/issueFix.routes.js"

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(express.json())

app.use(cors({
    origin: (origin, callback) => callback(null, origin || true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }))

app.use("/api/dashboard/", dashboardRoutes)
app.use("/api/repo/", repoRoutes)
app.use("/api/pr/", prRoutes)
app.use("/api/user/", userRoutes)
app.use("/api/deployment/", deploymentRoutes)
app.use("/api/ai-usage/", aiUsageRoutes)
app.use("/api/pr/", issueFixRoutes)

app.listen(PORT, () => console.log(`API service listening on port ${PORT}`))