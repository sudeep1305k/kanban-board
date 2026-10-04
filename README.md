# Kanban Board (Full Stack)

![CI](https://github.com/sudeep1305k/kanban-board/actions/workflows/ci.yml/badge.svg)

A full stack task board where each user manages private tasks across **To Do / In Progress / Done** columns using drag and drop.

**Stack:** React 18 (Vite) · Node.js + Express · SQLite (better-sqlite3) · JWT auth · bcrypt · GitHub Actions CI

## Features
- Sign up / log in with JWT authentication (bcrypt-hashed passwords, 2-hour tokens)
- Create tasks with priority, drag and drop between columns, delete tasks
- Debounced live search
- Optimistic UI updates with rollback if the server rejects a change
- Every query is scoped to the logged-in user, so no one can read or edit another user's tasks
- Server-side validation, automated API tests, CI that runs tests and builds the client

## Project structure
```
kanban-board/
  server/   Express API (routes, auth middleware, SQLite) + tests
  client/   React app (Vite)
```

## Run locally
Open **two terminals**.

Terminal 1 (API):
```bash
cd server
npm install
npm run dev
```
Terminal 2 (React app):
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173

## Run tests
```bash
cd server
npm test
```

## Production build
```bash
cd client && npm run build
cd ../server && npm start
```
The Express server detects `client/dist` and serves the React app, so the whole app runs from one process on one port.

## Environment variables (`server/.env.example`)
| Variable | Purpose |
|---|---|
| PORT | API port (default 4000) |
| JWT_SECRET | Secret used to sign tokens. Always set this in production |
| DB_PATH | SQLite file path (default `data.db`) |

## API
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create account, returns token |
| POST | /api/auth/login | Log in, returns token |
| GET | /api/tasks?status=&search= | List own tasks |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Design decisions
- **Ownership check in SQL** (`WHERE id = ? AND user_id = ?`), so other users get a 404 and the task's existence is not revealed.
- **Optimistic updates** keep drag and drop feeling instant.
- **SQLite** keeps setup to zero; the data layer is small enough to move to PostgreSQL later.

## Future improvements
Task descriptions and due dates, multiple boards, refresh tokens, PostgreSQL, deployment on Render.

## What I learned
Building a React + Express app end to end: authentication flow, protected routes, optimistic UI, API validation and testing.
