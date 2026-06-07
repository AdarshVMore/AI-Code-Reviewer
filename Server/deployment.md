# Fly.io Deployment Guide

This backend is deployed as three Fly apps:

- `ai-code-reviewer-api-app`: public API service, port `3001`
- `ai-code-reviewer-webhook-app`: public GitHub webhook service, port `3002`
- `ai-code-reviewer-worker-app`: private background worker, no public HTTP port

The frontend uses only the API URL:

```env
NEXT_PUBLIC_API_URL=https://ai-code-reviewer-api-app.fly.dev
```

GitHub uses the webhook URL:

```txt
https://ai-code-reviewer-webhook-app.fly.dev/webhook/github
```

## Required Runtime URLs

Frontend deployed on Vercel:

```txt
https://custom-ai-code-reviewer.vercel.app
```

GitHub OAuth callback URL:

```txt
https://custom-ai-code-reviewer.vercel.app/api/auth/callback/github
```

GitHub App webhook URL:

```txt
https://ai-code-reviewer-webhook-app.fly.dev/webhook/github
```

## Architecture

Use one shared Postgres database for all three backend apps.

Important: do not let Fly attach create three separate database names such as:

```txt
/ai_code_reviewer_api_app
/ai_code_reviewer_webhook_app
/ai_code_reviewer_worker_app
```

All apps should use the same `DATABASE_URL` database path. In this project, the API database path is:

```txt
/ai_code_reviewer_api_app
```

The webhook and worker must also point to that same database.

## Redis URL Fix

`Server/package/lib/redis.client.ts` should read Redis from env:

```ts
const REDIS_URL = process.env.REDIS_URL ?? "redis://redis:6379";
```

The fallback keeps local Docker Compose working. Fly uses the `REDIS_URL` secret.

## Fly Config Files

These files live in `Server/`.

### `fly.api.toml`

```toml
app = "ai-code-reviewer-api-app"
primary_region = "bom"

[build]
  dockerfile = "app/api-service/Dockerfile"

[deploy]
  release_command = "npx prisma migrate deploy"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
```

### `fly.webhook.toml`

```toml
app = "ai-code-reviewer-webhook-app"
primary_region = "bom"

[build]
  dockerfile = "app/webhook-service/Dockerfile"

[http_service]
  internal_port = 3002
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
```

### `fly.worker.toml`

```toml
app = "ai-code-reviewer-worker-app"
primary_region = "bom"

[build]
  dockerfile = "app/worker-service/Dockerfile"

[processes]
  app = "node dist/app/worker-service/index.js"
```

## Dockerfile Pattern

Each service has its own Dockerfile. Prefer `npm ci` with `package-lock.json`.

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx tsc

CMD ["node", "dist/app/api-service/index.js"]
```

Use the matching final command for each service:

```dockerfile
CMD ["node", "dist/app/api-service/index.js"]
CMD ["node", "dist/app/webhook-service/index.js"]
CMD ["node", "dist/app/worker-service/index.js"]
```

## Create Fly Apps

Run from `Server/`:

```bash
fly apps create ai-code-reviewer-api-app
fly apps create ai-code-reviewer-webhook-app
fly apps create ai-code-reviewer-worker-app
```

If the apps already exist, skip this step.

## Postgres

Create Postgres:

```bash
fly postgres create
```

Attach it to the API app first:

```bash
fly postgres attach ai-code-reviewer-pg --app ai-code-reviewer-api-app
```

This creates the API app's `DATABASE_URL`.

Get the exact API database URL:

```bash
fly ssh console --app ai-code-reviewer-api-app -C "printenv DATABASE_URL"
```

Set that exact same URL on webhook and worker:

```bash
fly secrets set DATABASE_URL='PASTE_API_DATABASE_URL_HERE' --app ai-code-reviewer-webhook-app
fly secrets set DATABASE_URL='PASTE_API_DATABASE_URL_HERE' --app ai-code-reviewer-worker-app
```

Why this matters: if you attach Postgres separately to webhook and worker, Fly may create separate database names. Then Prisma tables exist in the API database but not in the webhook database.

## Redis

Create Redis:

```bash
fly redis create
```

Set the Redis URL on all three apps:

```bash
fly secrets set REDIS_URL='redis://...' --app ai-code-reviewer-api-app
fly secrets set REDIS_URL='redis://...' --app ai-code-reviewer-webhook-app
fly secrets set REDIS_URL='redis://...' --app ai-code-reviewer-worker-app
```

## Backend Secrets

Set secrets through Fly, not `.env`.

Common secrets:

```bash
fly secrets set GITHUB_SECRET='...' --app ai-code-reviewer-webhook-app
fly secrets set GITHUB_APP_ID='...' --app ai-code-reviewer-api-app
fly secrets set GITHUB_PRIVATE_KEY='...' --app ai-code-reviewer-api-app
fly secrets set ANTHROPIC_API_KEY='...' --app ai-code-reviewer-api-app
fly secrets set PINECONE_API_KEY='...' --app ai-code-reviewer-api-app
fly secrets set GIPHY_API_KEY='...' --app ai-code-reviewer-api-app
fly secrets set access_token='...' --app ai-code-reviewer-api-app
```

The worker usually needs the same GitHub and AI secrets as the API:

```bash
fly secrets set GITHUB_APP_ID='...' --app ai-code-reviewer-worker-app
fly secrets set GITHUB_PRIVATE_KEY='...' --app ai-code-reviewer-worker-app
fly secrets set ANTHROPIC_API_KEY='...' --app ai-code-reviewer-worker-app
fly secrets set PINECONE_API_KEY='...' --app ai-code-reviewer-worker-app
fly secrets set GIPHY_API_KEY='...' --app ai-code-reviewer-worker-app
fly secrets set access_token='...' --app ai-code-reviewer-worker-app
```

The webhook needs:

```bash
fly secrets set GITHUB_SECRET='...' --app ai-code-reviewer-webhook-app
```

If a service crashes because an env var is missing, add that same secret to that app.

## Deploy Backend

Run from `Server/`:

```bash
fly deploy -c fly.api.toml
fly deploy -c fly.webhook.toml
fly deploy -c fly.worker.toml
```

Prisma migrations run from the API app only:

```toml
[deploy]
  release_command = "npx prisma migrate deploy"
```

Do not run migrations from webhook and worker.

## Verify Prisma

Check migration status:

```bash
fly ssh console --app ai-code-reviewer-api-app -C "sh -lc 'cd /app && npx prisma migrate status'"
```

Apply pending migrations manually if needed:

```bash
fly ssh console --app ai-code-reviewer-api-app -C "sh -lc 'cd /app && npx prisma migrate deploy'"
```

Expected healthy output:

```txt
Database schema is up to date!
No pending migrations to apply.
```

Check which database each app uses:

```bash
fly ssh console --app ai-code-reviewer-api-app -C "sh -lc 'node -e \"const u=new URL(process.env.DATABASE_URL); console.log(u.hostname, u.pathname)\"'"
fly ssh console --app ai-code-reviewer-webhook-app -C "sh -lc 'node -e \"const u=new URL(process.env.DATABASE_URL); console.log(u.hostname, u.pathname)\"'"
fly ssh console --app ai-code-reviewer-worker-app -C "sh -lc 'node -e \"const u=new URL(process.env.DATABASE_URL); console.log(u.hostname, u.pathname)\"'"
```

All three should print the same database path:

```txt
ai-code-reviewer-pg.flycast /ai_code_reviewer_api_app
```

If webhook prints `/ai_code_reviewer_webhook_app`, it is using the wrong database.

## Verify Redis

Check Redis env var:

```bash
fly ssh console --app ai-code-reviewer-webhook-app -C "printenv REDIS_URL"
fly ssh console --app ai-code-reviewer-worker-app -C "printenv REDIS_URL"
```

Watch logs after sending a webhook:

```bash
fly logs --app ai-code-reviewer-webhook-app
fly logs --app ai-code-reviewer-worker-app
```

Healthy webhook logs should include:

```txt
Webhook service started on port 3002
redis client connected successfully
github event received: pull_request
```

## Vercel Frontend Env

Set these in Vercel project environment variables:

```env
NEXT_PUBLIC_API_URL=https://ai-code-reviewer-api-app.fly.dev

AUTH_URL=https://custom-ai-code-reviewer.vercel.app
NEXTAUTH_URL=https://custom-ai-code-reviewer.vercel.app

AUTH_SECRET=your-long-random-secret
NEXTAUTH_SECRET=your-long-random-secret
AUTH_TRUST_HOST=true

GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

Redeploy Vercel after changing env vars.

## GitHub OAuth App Settings

Homepage URL:

```txt
https://custom-ai-code-reviewer.vercel.app
```

Authorization callback URL:

```txt
https://custom-ai-code-reviewer.vercel.app/api/auth/callback/github
```

The callback path ends in `github`, not `git`.

## GitHub App Webhook Settings

Webhook URL:

```txt
https://ai-code-reviewer-webhook-app.fly.dev/webhook/github
```

Webhook secret must match:

```env
GITHUB_SECRET=...
```

Set that secret on the webhook app:

```bash
fly secrets set GITHUB_SECRET='...' --app ai-code-reviewer-webhook-app
```

## Restart Apps

After changing secrets:

```bash
fly apps restart ai-code-reviewer-api-app
fly apps restart ai-code-reviewer-webhook-app
fly apps restart ai-code-reviewer-worker-app
```

## Logs

```bash
fly logs --app ai-code-reviewer-api-app
fly logs --app ai-code-reviewer-webhook-app
fly logs --app ai-code-reviewer-worker-app
```

## Common Errors

### `The table public.User does not exist`

Webhook or worker is probably connected to the wrong database.

Check:

```bash
fly ssh console --app ai-code-reviewer-webhook-app -C "sh -lc 'node -e \"const u=new URL(process.env.DATABASE_URL); console.log(u.hostname, u.pathname)\"'"
```

Fix by setting the API app's exact `DATABASE_URL` on webhook and worker.

### `UntrustedHost: Host must be trusted`

Set this in Vercel:

```env
AUTH_TRUST_HOST=true
```

Also keep this in `client/src/auth.ts`:

```ts
trustHost: true,
```

### GitHub OAuth redirects to `/api/auth/error`

Check:

- Vercel has `GITHUB_CLIENT_ID`
- Vercel has `GITHUB_CLIENT_SECRET`
- Vercel has `AUTH_SECRET` and `NEXTAUTH_SECRET`
- GitHub OAuth callback is exactly `/api/auth/callback/github`
- You are using OAuth App credentials, not GitHub App credentials

### Redis connection fails

Check:

```bash
fly ssh console --app ai-code-reviewer-worker-app -C "printenv REDIS_URL"
```

Also confirm the code uses:

```ts
process.env.REDIS_URL ?? "redis://redis:6379"
```

### Frontend cannot call API

Check Vercel env:

```env
NEXT_PUBLIC_API_URL=https://ai-code-reviewer-api-app.fly.dev
```

Then redeploy the frontend.
