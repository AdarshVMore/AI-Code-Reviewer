import "dotenv/config";
import { workersOn } from "./workers/review.worker.js";
import { deploymentWorkerOn } from "./workers/deployment.worker.js";

workersOn();
deploymentWorkerOn();