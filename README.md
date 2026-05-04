# The Collective

An AI-assisted notetaking application designed to help students stay organized with both their academic and personal lives — built by **The Notetakers**.

---

## Team

| Role | Name |
|---|---|
| Project Manager | Karissa Thompson |
| Frontend Developer | Denhem Smullen |
| Backend Developer | Maxwell Lukyamuzi |
| AI Integration Developer | Landon Williams |
| Tester | Elijah Eskridge |

---

## Overview

The Collective helps users keep track of their work and daily practices throughout their lives. Students can capture notes for classes and campus events while an integrated AI service files them into the right folders automatically. The UI is intentionally calm and uncluttered to support student mental health.

Users can create, edit, and store notes. The app uses an **existing AI service (OpenAI's API)** to automatically sort and organize notes into relevant groups, which reduces the need for manual organization.

---

## Scope

This project is a functional prototype that demonstrates how an **existing AI service can be integrated** into the system to achieve intelligent note organization. Rather than training our own AI model, we integrate OpenAI's API to reach the same outcomes — automatic categorization, smart grouping, and reduced manual work — without the overhead of building a model from scratch.

**What's in scope:**
- User authentication
- Note management (create, edit, delete, search)
- Automated categorization powered by the OpenAI API
- Keyword-based fallback when the AI is unavailable
- Folder organization

**Out of scope:** training custom models, large-scale cloud infrastructure, mobile apps.

---

## Features

- Create, edit, and delete notes
- AI-assisted categorization via OpenAI
- Organize notes into folders (Classes, Events, Personal, To-Do — seeded for new users)
- Full-text search across titles and content
- Filter by folder
- User authentication with hashed passwords and JWT sessions
- Clean, minimal interface focused on reducing stress

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | SQLite (via `better-sqlite3`) |
| Styling | Tailwind CSS |
| Authentication | JWT + bcrypt (httpOnly cookies) |
| AI Service | OpenAI API (`gpt-4o-mini`) |

---

## Methodology

Our team uses an **Agile** development approach, working in short cycles. Each cycle focuses on a specific set of features, allowing us to test, gather feedback, and improve along the way.

---

## Installation

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/the-collective.git
cd the-collective

# 2. Install dependencies
npm install
```

## Setup

```bash
# 3. Copy the example environment file
cp .env.example .env
```

Then edit `.env` and set:

- **`OPENAI_API_KEY`** — Get one at <https://platform.openai.com/api-keys>
- **`JWT_SECRET`** — Any long random string (32+ characters)

```bash
# 4. Initialize the SQLite database
npm run init-db
```

## Running the Application

```bash
# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000> in your browser. Create an account, and you'll land in the notes app with four starter folders (Classes, Events, Personal, To-Do). Write a note, then click **AI categorize** to see the AI file it automatically.

### Production build

```bash
npm run build
npm run start
```

---

## Project Structure

```
the-collective/
├── app/                      # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/             # register, login, logout, me
│   │   ├── notes/            # CRUD for notes
│   │   ├── folders/          # CRUD for folders
│   │   └── categorize/       # AI folder-suggestion endpoint
│   ├── login/page.js         # Login page
│   ├── register/page.js      # Registration page
│   ├── notes/page.js         # Main three-pane notes UI
│   ├── layout.js             # Root layout
│   ├── page.js               # Landing page
│   └── globals.css           # Tailwind + base styles
├── lib/
│   ├── db.js                 # SQLite connection + schema
│   ├── init-db.js            # One-time DB initialization script
│   ├── auth.js               # JWT + bcrypt + session helpers
│   └── ai.js                 # OpenAI integration (with keyword fallback)
├── .env.example              # Template for environment variables
├── package.json
└── README.md
```

---

## How the AI Integration Works

When a user clicks **AI categorize** on a note, the app:

1. Sends the note's title and body, plus the list of the user's folder names, to `/api/categorize`.
2. The backend calls OpenAI's `gpt-4o-mini` model with a classification prompt.
3. The model replies with JSON like `{"folder": "Classes", "reasoning": "Mentions an upcoming exam."}`.
4. The app validates the folder name, assigns the note to that folder, and shows the AI's reasoning to the user.
5. If the API is unreachable, a simple keyword-matcher picks the best folder so the app stays functional.

This approach — **using** a pre-built AI rather than **building** one — lets us deliver intelligent categorization with about 30 lines of integration code and no machine-learning infrastructure.

---

## Project Deliverables

- **Deliverable 1** — Team name, project title, and high-level overview
- **Deliverable 2** — Project proposal (scope, features, methodology, roles)
- **Deliverable 3** — Implementation: this repository, documented code with meaningful comments, this README, and a separate document illustrating software functionality through snapshots

---

## License

TBD
