# slackthon_project
# Slack AI Agent for Good

> An intelligent Slack-native AI assistant that combines **Slack AI**, **Real-Time Search**, and **Model Context Protocol (MCP)** to provide live information retrieval and AI-powered task management directly inside Slack.

![Architecture](Architecture.png)

---

# Overview

Slack AI Agent for Good transforms Slack into a unified productivity and knowledge hub.

Instead of switching between multiple applications for searching information and managing tasks, users can simply chat with an AI assistant inside Slack.

The agent intelligently understands user intent and automatically decides whether to:

- Search the web using the **Tavily Real-Time Search API**
- Execute task management through a **custom MCP Server**
- Respond directly using **Google Gemini**

The project demonstrates how modern AI agents can improve collaboration for students, non-profit organizations, volunteer communities, and small teams.

---

# Features

## Slack AI Assistant

- Native Slack Assistant Panel
- Thread-aware conversations
- Suggested prompts
- Live thinking indicator
- Context-aware responses

---

## Real-Time Search

- Powered by Tavily Search API
- Retrieves current information from the web
- Returns reliable sources
- No need to leave Slack

Example:

> "What are today's AI news headlines?"

---

## MCP Task Manager

Natural language task management directly from Slack.

Supported operations:

- Add Task
- List Tasks
- Complete Tasks

Example:

> Create a task: Finish presentation tomorrow

---

## Intelligent Tool Routing

Google Gemini works as the orchestration engine.

It automatically determines whether a user's request needs

- Real-Time Search
- MCP Task Manager
- Direct AI response

without requiring users to specify the tool.

---

# Architecture

```
                          Slack Workspace
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │  Assistant Panel    /ask Command     @Mentions          │
 │                                                         │
 └───────────────────────┬─────────────────────────────────┘
                         │
                         ▼
                Slack Bolt Application
                     (Node.js)
                         │
                         ▼
                Google Gemini AI Agent
              (Intent & Tool Orchestrator)
                    ┌───────────────┐
         Search      │               │     Tasks
     ───────────────►│               │◄──────────────
                    ▼               ▼
          Tavily Search API     MCP Client
                                     │
                                     ▼
                           MCP Task Manager
                              (server.js)
                                     │
                                     ▼
                               tasks.json
```

See **Architecture.png** for the complete visual architecture.

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| Slack Bolt (JavaScript) | Slack App Framework |
| Slack AI Assistant | Native Slack AI Experience |
| Google Gemini | AI Agent & Decision Making |
| Tavily Search API | Real-Time Web Search |
| MCP SDK | Tool Communication |
| Node.js | Backend Runtime |
| JavaScript | Application Logic |

---

# Project Structure

```
slack-ai-agent/
│
├── app.js                 # Slack Bolt entry point
├── agent.js               # AI Agent orchestration
├── assistant.js           # Slack Assistant Panel
├── mcpClient.js           # MCP client
├── package.json
├── package-lock.json
├── README.md
├── .env.example
├── .gitignore
│
├── mcp-server/
│   ├── server.js          # MCP Task Server
│   ├── package.json
│   ├── tasks.json
│   └── README.md
│
└── screenshots/
    ├── assistant.png
    ├── search.png
    ├── task.png
    └── demo.gif
    ├── Architecture.png
```

---

# Installation

## 1 Clone Repository

```bash
git clone https://github.com/<your-username>/slack-ai-agent.git

cd slack-ai-agent
```

---

## 2 Install Dependencies

Install the main application dependencies

```bash
npm install
```

Install MCP server dependencies

```bash
cd mcp-server

npm install

cd ..
```

---

## 3 Configure Environment Variables

Create a `.env` file in the project root.

```
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=
GEMINI_API_KEY=
TAVILY_API_KEY=
```

---

## 4 Start the Application

```bash
npm start
```

You should see

```
Connected to MCP Server

Slack AI Agent is running...
```

---

# MCP Server

The project includes a custom MCP (Model Context Protocol) server located in the **mcp-server/** directory.

The MCP server exposes task management tools including:

- add_task
- list_tasks
- complete_task

The Slack AI Agent communicates with this server using the MCP protocol, allowing Gemini to execute task-related actions through natural language.

---

# Usage

## Assistant Panel

Open the Slack AI Assistant Panel and ask

```
What are today's AI news?
```

---

## Slash Command

```
/ask What is Quantum Computing?
```

---

## Mention

```
@SlackAgent Summarize today's AI news.
```

---

## Task Management

Create a task

```
Create a task:
Prepare Hackathon Presentation by tomorrow
```

List tasks

```
List my tasks
```

Complete task

```
Complete task 1
```

---

# Screenshots

### Slack AI Assistant

![Assistant](screenshots/assistant.png)

---

### Real-Time Search

![Search](screenshots/search.png)

---

### MCP Task Management

![Tasks](screenshots/task.png)

---

# Workflow

1. User sends a message through Slack.
2. Slack forwards the request to the Bolt application.
3. Google Gemini analyzes the user's intent.
4. Gemini decides whether to:
   - Search the web via Tavily
   - Execute an MCP tool
   - Answer directly
5. The selected service processes the request.
6. Results are returned to the user inside Slack.

---

# Impact

Slack AI Agent for Good is designed to improve collaboration for:

- Student organizations
- Volunteer communities
- Non-profit organizations
- Small teams
- Startup teams

Instead of switching between multiple applications, users receive intelligent assistance directly inside Slack.

This reduces context switching, saves time, improves collaboration, and enables teams to focus on meaningful work.

---

# Future Improvements

- Google Calendar Integration
- GitHub Integration
- Jira Integration
- Notion Integration
- Persistent Database
- Multi-user Task Synchronization
- Team Analytics Dashboard

---

# License

This project is licensed under the MIT License.

---

# Authors

Developed during the **Slack Hackathon 2026**.

If you found this project helpful, consider ⭐ starring the repository!
open source contibutions are allowed.

