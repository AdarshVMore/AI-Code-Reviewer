import "dotenv/config";
import express from "express";
import { workersOn } from "./workers/review.worker.js";
import { deploymentWorkerOn } from "./workers/deployment.worker.js";
import { ragWorker } from "./workers/rag.worker.js";

// worker-service has no HTTP work of its own — the brPop loops below do everything.
// This server exists only so Render can run it as a Web Service: that's what makes
// the free-tier "sleep after 15 min idle, wake on next request" behavior apply here,
// since Render can't sleep/wake a process with no port to send a request to.
const app = express();
const PORT = Number(process.env.PORT) || 3003;

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.listen(PORT, () => console.log(`Worker service health endpoint listening on port ${PORT}`));

workersOn();
deploymentWorkerOn();
ragWorker();
