import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import githubWebhookRouter from "./routes/github.webhook";

const app = express();
const port = 3000;

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
