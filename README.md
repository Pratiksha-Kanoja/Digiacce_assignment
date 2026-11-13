# To Do List

A mobile to-do app built with Next.js. Tasks are stored by this app’s own API and grouped into weeks that run Monday through Sunday.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The first request creates `data/tasks.json` with sample tasks for this week, last week, and next week. That file is local runtime data and is not committed.

## What you can do

- Get started from the onboarding screen
- See each week’s open and completed counts, plus a progress bar
- Move between weeks and pick a day
- Open a week with **View All**, or tap a summary card to expand that status
- Add, edit, and delete tasks
- Mark a task completed or in progress
- Search by title or description
- Swipe a task left and tap **Delete**

A task needs a title, date, and start time. Description, end time, and priority are optional.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks. `q` searches title and description. `today` (`YYYY-MM-DD`) is used only when the store is created. |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Read one task |
| `PATCH` | `/api/tasks/:id` | Update any fields, including `status` |
| `DELETE` | `/api/tasks/:id` | Delete a task |

```bash
curl http://localhost:3000/api/tasks
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Read chapter 4","date":"2026-11-13","startTime":"18:00","priority":"high"}'
```
