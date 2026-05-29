# Agent Instructions

## Project Summary

RepVolunteers is a theatre volunteer shift management application for Adelaide
Rep Theatre. It helps administrators manage productions, performance dates,
volunteer records, shift roles, assignments, unfilled shifts, schedules, and
volunteer communications. Volunteers can register, receive a personal login
link, view available shifts, sign up, swap shifts, remove themselves from
shifts, and download schedule PDFs.

The primary product goal is to reduce manual coordination for theatre
front-of-house and production volunteer scheduling while keeping the
volunteer-facing experience simple and mobile friendly.

## Technology Stack

- Runtime: Deno 2.3+
- Language: TypeScript with strict compiler settings
- Web framework: Oak
- Database: PostgreSQL
- Authentication: Better Auth with email/password admin accounts
- Email delivery: Resend
- Templating: server-rendered TypeScript/HTML templates and Mustache email
  templates
- PDF generation: jsPDF-based utilities
- Frontend: server-rendered HTML, CSS, and vanilla JavaScript
- PWA support: `manifest.webmanifest`, `service-worker.js`, and platform icons
- Dev/prod packaging: Docker and Docker Compose

## Key Concepts

- A production is the overall theatre show and is stored in `shows`.
- A performance, sometimes called a show in user wording, is a single dated
  event of a production and is stored in `show_dates`.
- Volunteers are stored in `participants`.
- A shift is a volunteer role within one performance; shifts are stored in
  `shifts` and belong to a `show_date`.
- Volunteer shift assignments are stored in `participant_shifts`.
- Some shifts can also have `assigned_participant_id` for direct assignment.
- Admin users, sessions, accounts, and verification tokens are managed by Better
  Auth tables.
- Times are stored as `TIMESTAMPTZ`; Adelaide timezone handling is centralized
  in `src/utils/timezone.ts`. The app must always display performance and shift
  times in Adelaide, Australia time regardless of the client's local timezone.
- Sent emails and generated attachments are recorded in `sent_emails` and
  `email_attachments`.

## Important Paths

- `src/main.ts`: application entry point; loads environment, initializes
  database pools, mounts routes.
- `src/routes/index.ts`: top-level routing and static/PWA asset serving.
- `src/routes/admin.ts`: protected admin pages and admin API routes.
- `src/routes/volunteer.ts`: volunteer signup, PDF, shift selection, swap, and
  removal routes.
- `src/routes/auth.ts`: Better Auth routing plus registration and volunteer
  login-link endpoints.
- `src/controllers/admin.ts`: admin workflow handlers.
- `src/controllers/volunteer.ts`: volunteer workflow handlers.
- `src/models/db.ts`: database pool initialization and accessors.
- `src/utils/db-utils.ts`: PostgreSQL connection helpers.
- `src/utils/email.ts`: volunteer email templates and sending.
- `src/utils/admin-email.ts`: admin password reset email.
- `src/utils/email-tracking.ts`: sent email and attachment persistence.
- `src/utils/pdf-generator.ts`, `src/utils/run-sheet-pdf-generator.ts`,
  `src/utils/unfilled-shifts-pdf-generator.ts`: PDF generation.
- `src/views/admin/templates/`: admin page templates.
- `src/views/email/`: HTML email templates.
- `db/schema.sql`: baseline database schema.
- `scripts/`: migration, admin setup, and maintenance scripts.

## Local Development

Use the Deno tasks when running directly:

```bash
deno task start
deno task dev
deno task migrate
```

For Docker development on Windows:

```powershell
.\dev.ps1 up
.\dev.ps1 logs
.\dev.ps1 down
```

`dev.ps1 logs` does not accept Docker Compose flags such as `--tail`. When
tailed or filtered logs are needed, use Docker Compose directly, for example
`docker compose -f docker-compose.dev.yml logs --tail 40 theatreapp`.

The development Docker Compose file expects an external Docker network named
`backend` and an `.env` file based on `.env.example`.

For local browser/API testing on this PC, prefer `http://127.0.0.1:8044` over
`http://localhost:8044`. `localhost` may resolve to the Docker/WSL listener
first, while `127.0.0.1:8044` targets the local Deno watcher for this checkout.

After any code or configuration change in this repo, rebuild and restart the
local development Docker app before handing off unless the user explicitly asks
not to, Docker is unavailable, or the change is purely documentation that cannot
affect the running app. Treat this as a required handoff step, not an optional
courtesy. Use the relevant compose/dev script, for example `.\dev.ps1 up` or
`docker compose -f docker-compose.dev.yml up -d --build`.

After the rebuild, verify that the container is running and check the changed
route against the URL the user is using. For local browser/API testing on this
PC, prefer `http://127.0.0.1:8044`.

## Environment Variables

Expected configuration includes:

- `PORT`
- `DATABASE_URL`
- `SESSION_SECRET`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BASE_URL`
- `PUBLIC_BASE_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `FROM_NAME`
- `DENO_ENV`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_ADMIN_GROUP_ID`

Do not commit real secrets. Use `.env.example` or `.env.template` for
placeholder values only.

## Development Guidelines

- Prefer existing Oak route/controller patterns over introducing new framework
  abstractions.
- Keep admin-only functionality behind `requireAdminAuth`.
- Keep database access through `getPool()` or `getAuthPool()` after `initDb()`
  has run.
- Use parameterized SQL queries. Do not interpolate user input into SQL strings.
- Preserve Adelaide timezone behavior. Use helpers from `src/utils/timezone.ts`
  when formatting, inserting, or comparing show and shift times.
- Do not use browser-local or host-local timezone formatting for app-visible
  production, performance, shift, email, or PDF times. Show Adelaide time unless
  the task explicitly introduces a separate labelled timezone.
- Keep volunteer-facing screens mobile friendly.
- Keep frontend changes in the existing server-rendered HTML/CSS/vanilla JS
  style unless the project deliberately adopts a frontend framework.
- Reuse existing toast and modal utilities where practical.
- Record sent emails and attachments when extending email workflows.
- When adding schema changes, add migration scripts under `scripts/` and keep
  `db/schema.sql` aligned with the current baseline.
- Avoid changing generated PWA icon assets unless the task is specifically about
  icons or branding.

## Verification

Before handing off code changes, run the most relevant checks available for the
change:

```bash
deno check src/main.ts
deno task migrate
deno task dev
```

For route or controller work, start the app and manually verify the changed
page/API path. For database changes, verify against a local PostgreSQL instance
with a representative `.env`.

## Current Product Areas

- Admin login, logout, password reset, and admin session handling.
- Show and performance-date management.
- Show interval management for running sheets.
- Volunteer registration, approval, editing, and deletion.
- Shift creation, editing, deletion, calendar data, and default roles.
- Volunteer-to-shift assignment and removal.
- Volunteer self-service signup pages.
- Schedule, run sheet, removal, and unfilled-shift PDFs.
- Individual and bulk emails for login links, schedules, show-week
  communications, and last-minute unfilled shifts.
- Email history and attachment download for volunteers.
- PWA installation support for mobile users.

## Known Cautions

- `src/routes/auth.ts` contains custom Better Auth URL handling. Be careful when
  changing auth paths or base URLs.
- Email sending has development/production behavior and a `force=true` flow.
  Preserve this behavior unless the task explicitly changes it.
- The app mixes `postgres` and `pg`: `postgres` is used for application database
  access, while `pg` is used for Better Auth compatibility.
- A few reference/orphan files appear to remain, such as
  `src/utils/pdf-generator-legacy.ts` and likely
  `src/views/admin/bulk-email.html`. Most similarly named PDF utilities are
  active, so check imports before refactoring or deleting.
- The repository includes Windows alternate data stream marker files with
  `Zone.Identifier` in their names. Do not edit or depend on those files.

## Agent Behavior

- Read nearby code before editing; this project has several workflow-specific
  conventions.
- Keep changes scoped to the requested feature or bug.
- Do not introduce new dependencies unless they clearly reduce complexity and
  fit Deno.
- Do not rewrite large templates or controllers as part of unrelated changes.
- If a task touches authentication, email delivery, database schema, or shift
  assignment logic, explain the verification performed and any remaining risk.
