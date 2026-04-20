import "dotenv/config";
import { workersOn } from "./workers/review.worker.js";
import { deploymentWorkerOn } from "./workers/deployment.worker.js";
import { ragWorker } from "./workers/rag.worker.js";

workersOn();
deploymentWorkerOn();
ragWorker()