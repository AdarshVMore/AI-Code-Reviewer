import "dotenv/config";
import express from "express";
import cors from 'cors';

import dashboardRoutes from "./routes/dashboard.routes.js"
import repoRoutes from "./routes/repos.route.js"
import prRoutes from "./routes/pr.routes.js"
import userRoutes from "./routes/user.routes.js"
import deploymentRoutes from "./routes/deployment.routes.js"

const app = express()

app.use(express.json())

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use("/api/dashboard/", dashboardRoutes)
app.use("/api/repo/", repoRoutes)
app.use("/api/pr/", prRoutes)
app.use("/api/user/", userRoutes)
app.use("/api/deployment/", deploymentRoutes)

app.listen(3001, () => console.log("API service listening on port 3001"))