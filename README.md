# LeadFlow

A single-screen lead management tool: track leads, log every discussion, and set follow-up reminders.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind, TanStack Query, Radix Dialog) · FastAPI · SQLAlchemy 2 · SQLite

## Features

- Lead list with name, status badge, last note and "time ago"
- Status filter (All / New / Contacted / Qualified / Proposal Sent / Won / Lost) and search by name or company
- Today's follow-ups pinned at the top; overdue follow-ups highlighted in red and listed first
- Click a lead to open a dialog with the full discussion timeline (newest first), a form to log a note with an optional follow-up date and time, and a status dropdown. Changes show up in the list straight away
- Add new lead (name required; company and phone optional; status defaults to New)

## Run it

### Option 1: Docker Compose

```bash
docker compose up --build
```

Open http://localhost:3000 (API docs at http://localhost:8000/docs). The database is seeded on first start and kept in a Docker volume.

### Option 2: Locally

You need Python 3.11+ and Node 20+.

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../.env.example .env
python -m app.seed                                    # 8 demo leads (safe to re-run; --reset to wipe)
uvicorn app.main:app --reload                         # http://localhost:8000

# 2. Frontend (new terminal)
cd frontend
cp ../.env.example .env.local                         # only NEXT_PUBLIC_API_URL is used here
npm install
npm run dev                                           # http://localhost:3000
```

### Environment variables

See [`.env.example`](.env.example): `DATABASE_URL`, `CORS_ORIGINS`, `SEED_TIMEZONE` (backend) and `NEXT_PUBLIC_API_URL` (frontend).

### Tests

```bash
cd backend && pytest        # API, validation, follow-up rules, seed data
cd frontend && npm test     # today / overdue classification, date handling
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/leads?status=&q=` | List leads with `last_note` / `last_discussion_at`. `q` searches name and company (case-insensitive). |
| POST | `/leads` | Create a lead (`name` required; status defaults to `New`). **201** |
| GET | `/leads/{id}` | One lead |
| PATCH | `/leads/{id}` | Partial update, e.g. `{"status": "Won"}` |
| GET | `/leads/{id}/discussions` | Full history, newest first |
| POST | `/leads/{id}/discussions` | Log a note with optional `follow_up_at`. **201** |

Errors always return `{"detail": "..."}`: **404** unknown lead, **422** validation (plus an `errors: [{field, message}]` list), **500** unexpected.

## Design decisions

- **Timezones.** Timestamps are stored and returned in UTC. `follow_up_at` must include an offset or `Z` (naive values get a 422).
  "Today" and "overdue" are decided in the browser using the user's local calendar day. A follow-up earlier today stays pinned (and turns red) rather than silently becoming "overdue".
- **Follow-ups.** Saving a discussion sets the lead's `follow_up_at` to the value sent, or clears it when none is sent, because logging a discussion means the previous follow-up was handled. The note and follow-up are saved in one transaction.
- **Last note.** The most recent note written by the rep. System entries ("Lead created", "Status changed ...") are only a fallback, so a status change never hides the real last conversation. The list is a single SQL query (no N+1).
- **System entries.** Creating a lead or changing its status adds an italic `is_system` entry to the timeline.
- **Updating the list.** Mutations invalidate the TanStack Query cache; the new note is also inserted into the timeline immediately. The open dialog reads its own lead query, so changing a status that no longer matches the active filter doesn't break it.
- **Schema setup.** Tables are created on startup; a migration tool (Alembic) would replace this in production.

## AI usage

_Fill this in honestly before submitting: which tools you used, what they generated, and what you wrote or changed yourself._
