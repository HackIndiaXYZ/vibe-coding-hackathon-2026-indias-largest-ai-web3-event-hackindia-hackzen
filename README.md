# vibe-coding-hackathon-2026-indias-largest-ai-web3-event-hackindia-hackzen
Hackathon team repository for HackZen - [hackindia-team:vibe-coding-hackathon-2026-indias-largest-ai-web3-event-hackindia:hackzen]


# SaaSMiner AI 

SaaSMiner AI is an advanced codebase analysis tool designed to scan, evaluate, and transform standard software repositories into monetization-ready SaaS (Software-as-a-Service) products. By scanning local ZIP uploads or cloning GitHub repositories, the system detects business domains, scores code complexity, suggests microservices, extracts API blueprints, and compiles printable PDF analysis reports.

Powered by **OpenRouter AI** for enterprise-grade SaaS Go-To-Market insights, via a provider-agnostic server-side proxy architecture.


## Table of Contents
1. [Key Features](#-key-features)
2. [Project Architecture](#-project-architecture)
3. [Registering & Sign-Up Data Storage](#-registering--sign-up-data-storage)
4. [API Keys & OpenRouter AI Integration](#-api-keys--openrouter-ai-integration)
5. [Getting Started (Run Locally)](#-getting-started-run-locally)


## Key Features

* **Local Codebase Analyzer**: Accepts zip files or Git URLs, runs file-tree diagnostics, tracks language percentages, and scans AST patterns (classes, functions, routing, and DB models).
* **Dual-Engine Recommendation Pipeline**:
  * **Heuristic Intelligence Engine**: Fallback rules-based scanner detecting domains, computing modularity scores, and generating structural roadmaps.
  * **OpenRouter AI Engine**: Generates professional deep insights via OpenRouter's model gateway, including monetization models, estimated Total Addressable Market (TAM), competitive advantage, and time-to-market.
* **Interactive UI Controls**:
  * **Interactive Source Switcher**: Instant switching between OpenRouter AI recommendations and Heuristic rule-based recommendations.
  * **Premium AI Spinner**: Orbiting CSS animation with elapsed time tracking displayed during AI analysis.
  * **Refresh Button**: Re-run AI analysis on demand for any project.
* **Interactive Architecture Visualizer**: Generates dynamic node-based diagrams using **React Flow** on the frontend, mapping proposed microservices.
* **PDF Report Generator**: Packages codebase intelligence into a downloadable, professionally formatted PDF report using `ReportLab`. Reports are enriched with live AI Insights from OpenRouter on every download.
* **User Dashboard**: Visualizes overall analytics, language metrics, top-scoring projects, and aggregate API endpoints.
* **Public Landing Page**: Introduces the product with feature highlights before authentication.
* **User Settings**: Manage account preferences from within the dashboard.
* **Post-Logout Redirect**: Users are returned to the homepage (`/`) after logging out.


## Project Architecture

The application is built as a split-architecture monolith:

* **Backend**: Python FastAPI with SQLite for persistent storage, SQLAlchemy ORM, and bcrypt password hashing. Structured as a Python package (`__init__.py`) to support relative imports.
* **Frontend**: React + TypeScript + Vite, using Tailwind CSS for UI design, Lucide icons, Framer Motion for transitions, React Flow for diagrams, and Recharts for dashboard analytics.


## Registering & Sign-Up Data Storage

All user registration and sign-up data is stored **locally** for privacy and self-containment.

* **Database Engine**: SQLite
* **Database File**: `project2product.db` (located in `backend/project2product.db`)
* **User Data Table**: `users`
* **Security & Hashing**: Passwords are secure and never stored in plain text. They are hashed using **bcrypt** via the Python `passlib` context before database commits.
* **Session Verification**: Stateless session verification is managed through JSON Web Tokens (JWT) signed locally using `python-jose`.


## API Keys & OpenRouter AI Integration

SaaSMiner AI uses **OpenRouter** as its AI provider, routed server-side via the OpenAI SDK. The API key is **never** sent to or exposed in the frontend.

OpenRouter offers access to a wide range of models (including free-tier options like `openai/gpt-oss-120b:free`) through a unified, OpenAI-compatible API.

### Environment Configuration (`.env`)
Create a `.env` file in the root directory:
```bash
# OpenRouter (required for AI recommendations)
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE

# Optional overrides
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# OPENROUTER_MODEL=openai/gpt-oss-120b:free
# OPENROUTER_CACHE_TTL=3600

# Gemini (legacy/fallback – optional)
# GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
# GEMINI_MODEL=flash
# GEMINI_CACHE_TTL=300
```

* **TTL Caching**: Recommendation responses are cached in-memory on the backend for 1 hour (3600 seconds) by default to minimize quota consumption and latency.
* **Fallback Behavior**: If no `OPENROUTER_API_KEY` is configured, or if the API call fails, the system gracefully falls back to the local Heuristic rules-based recommendation engine.
* **PDF AI Enrichment**: When a PDF report is downloaded, the backend fetches a live AI Insights block from OpenRouter and embeds it in the report. If AI is unavailable, the heuristic data is used alone.


## Getting Started (Run Locally)

### 1. Start the Backend
1. Navigate to the project root and activate your virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   # source venv/bin/activate   # macOS/Linux
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create your `.env` file (see [API Keys section](#-api-keys--openrouter-ai-integration) above).
4. Run the FastAPI dev server from the **project root** (required for package-relative imports):
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

### 2. Start the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web panel in your browser at `http://localhost:5173`.

> **Note**: The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically. Ensure the backend is running before using the frontend.
