import "dotenv/config";
import express from "express";
import { workersOn } from "./workers/review.worker.js";
import { deploymentWorkerOn } from "./workers/deployment.worker.js";
import { ragWorker } from "./workers/rag.worker.js";

const app = express();
const PORT = Number(process.env.PORT) || 3003;

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.listen(PORT, () => console.log(`Worker service health endpoint listening on port ${PORT}`));

workersOn();
deploymentWorkerOn();
ragWorker();
