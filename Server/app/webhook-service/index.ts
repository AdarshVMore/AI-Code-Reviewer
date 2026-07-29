import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import githubWebhookRouter from "./routes/github.webhook.js";

const app = express();
const port = Number(process.env.PORT) || 3002;

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.use(
  bodyParser.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    },
  })
);

app.use(githubWebhookRouter);

app.listen(port, () => {
  console.log(`Webhook service started on port ${port}`);
});
