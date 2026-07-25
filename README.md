# ReviewPilot — AI Code Reviewer for GitHub PRs

An AI-powered GitHub code review system that automatically analyzes pull requests and provides **context-aware code reviews, bug detection, best practices, performance suggestions, and architecture feedback** directly inside GitHub PRs.

Built for teams and developers who want **faster, consistent, and intelligent code reviews**.

---

## 🌐 Live Demo

**Web App:**
http://coderefyn.vercel.app/

**GitHub App Installation:**

> GitHub Marketplace listing is not published yet.

Install the public GitHub App here:
https://github.com/apps/coderefyn

---

## ✨ Features

* AI-powered pull request reviews
* Smart code analysis with contextual feedback
* Automated PR review comments
* Bug & code smell detection
* Performance and maintainability suggestions
* GitHub App integration
* Review dashboard UI

---


## 📸 Screenshots


### Dashboard / UI

<img width="100%" src="https://github.com/user-attachments/assets/0f6223d2-eae3-4cb1-b95b-89559e605bcd" />

<img width="100%" src="https://github.com/user-attachments/assets/2748b188-2a5b-4b4b-b33e-56c2255bd4f7" />

<img width="100%" src="https://github.com/user-attachments/assets/ddf9b899-5129-4d72-8b3e-0f9163f67de7" />

<img width="100%" src="https://github.com/user-attachments/assets/634da127-491e-4120-b900-1f946566bfcb" />

<img width="100%" src="https://github.com/user-attachments/assets/4ee3d218-b2d7-43d5-864c-68ab23a8b7e6" />

---

### AI Review Examples

<img width="100%" src="https://github.com/user-attachments/assets/5c4bb33b-30e7-4c33-bf5d-2a308162a3c9" />

<img width="1470" height="880" alt="image" src="https://github.com/user-attachments/assets/e9d6aee0-0ea5-4327-9678-32a0300d3fed" />

<img width="100%" src="https://github.com/user-attachments/assets/8ffbca88-37f0-4419-a0a3-da7d37c30ec2" />

<img width="1468" height="875" alt="image" src="https://github.com/user-attachments/assets/e80f9a2d-c95c-4826-9e4f-acd535c48623" />

<img width="1470" height="879" alt="image" src="https://github.com/user-attachments/assets/6a596482-e256-44f5-9373-ff720e8ffb5f" />

<img width="100%" src="https://github.com/user-attachments/assets/fd4b07c5-30b2-467a-a423-2ea2a6fc302c" />

---

## 🏗️ Old System Architecture

<img width="4389" height="2002" alt="1x" src="https://github.com/user-attachments/assets/ee8f1d07-504c-4035-8cba-c0458fb3aab6" />

---

## 🛠️ Tech Stack

### Frontend

* Next
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express

### Infrastructure & DevOps

* Docker
* GitHub Webhooks
* GitHub App APIs
* Queue Workers

### AI

* LLM-powered PR analysis
* Context-aware code review generation

---

## How It Works

1. Install the GitHub App in your repository
2. Create or update a Pull Request
3. Webhook triggers ReviewPilot
4. AI analyzes changed files and code context
5. Smart review comments are posted directly inside GitHub PRs

---

## Local Setup

### Clone Repository

```bash
git clone https://github.com/your-username/reviewpilot.git
cd reviewpilot
```

### Install Dependencies

```bash
cd Server && npm install
cd ../client && npm install
```

### Environment Variables

Create `Server/.env`:

```env
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

ANTHROPIC_API_KEY=
PINECONE_API_KEY=

DATABASE_URL=
REDIS_URL=

# Neo4j Aura (optional but recommended for graph-aware PR context)
# Create a free AuraDB instance at https://console.neo4j.io/
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=
# Optional Aura database name (defaults to the instance default)
# NEO4J_DATABASE=neo4j
```

Set the same `NEO4J_*` secrets on the Fly worker app so RAG indexing can persist the code graph.

Without Neo4j configured, reviews still work using Pinecone semantic search only.

### Run Application

```bash
docker compose up
```

### AST / Graph unit tests

```bash
cd Server
npm test
```

### Hybrid retrieval (Pinecone + Neo4j)

On each PR open/sync the worker:

1. Downloads the repo zip
2. Builds AST symbol chunks and a code graph (`defines` / `imports` / `exports` / `calls`)
3. Upserts chunks to Pinecone
4. Replaces that repo's snapshot in Neo4j Aura (when configured)

Feature reviews then expand changed files/symbols one hop in Neo4j and merge those neighbors with semantic matches before prompting the model.
---

## Future Improvements

* GitHub Marketplace publishing
* Multi-model AI support
* Team analytics dashboard
* Codebase memory
* Review quality scoring
* Slack/Discord notifications

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT
