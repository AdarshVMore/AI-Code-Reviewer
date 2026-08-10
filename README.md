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

### Architecture

<img width="1110" height="755" alt="image" src="https://github.com/user-attachments/assets/6ba5fbc6-d355-4c93-b759-2ba703691265" />


### Dashboard / UI

<img width="1470" height="881" alt="image" src="https://github.com/user-attachments/assets/87083ca7-d364-4d7d-bb95-1e04f6265093" />

<img width="1470" height="881" alt="image" src="https://github.com/user-attachments/assets/bc645512-5d19-4f95-8c5b-2b0c11a5dee5" />

<img width="1470" height="883" alt="image" src="https://github.com/user-attachments/assets/6a75eb46-d0e6-4d5c-b80c-14fc8f065756" />

<img width="1467" height="881" alt="image" src="https://github.com/user-attachments/assets/63d3421f-29f3-4615-b6ba-ad99a51e4dcd" />

<img width="1469" height="882" alt="image" src="https://github.com/user-attachments/assets/b8fe6cc1-98f2-40ce-81b5-48dbc7f5af68" />

<img width="1470" height="883" alt="image" src="https://github.com/user-attachments/assets/85edddf3-1ebe-4f77-8f57-0d0d5dad22c4" />

<img width="1470" height="880" alt="image" src="https://github.com/user-attachments/assets/d8421eaf-c9df-4665-bba1-b56baf975737" />

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
npm install
```

### Environment Variables

Create `.env`:

```env
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=

DATABASE_URL=
```

### Run Application

```bash
docker compose up
```

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
