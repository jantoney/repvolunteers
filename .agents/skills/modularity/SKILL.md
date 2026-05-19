---
name: modularity
description: Improve RepVolunteers code structure while preserving its Deno/Oak TypeScript architecture. Use when refactoring routes, controllers, server-rendered templates, database access, email/PDF utilities, timezone handling, shift assignment logic, or duplicated admin/volunteer workflow code into clearer, smaller, reusable modules.
---

# Modularity

Move RepVolunteers toward focused modules with clear responsibilities while respecting the existing Oak, TypeScript, PostgreSQL, and server-rendered HTML patterns.

Use this skill when a requested change exposes duplication, mixed responsibilities, or fragile boundaries. Keep refactors scoped to the task.

## Existing Boundaries

- `src/routes/` owns routing, middleware attachment, and request path structure.
- `src/controllers/` owns workflow handlers and request/response orchestration.
- `src/views/` owns server-rendered HTML templates and page-specific client JS.
- `src/models/db.ts` owns database pool initialization/access.
- `src/utils/db-utils.ts` owns PostgreSQL connection helpers.
- `src/utils/timezone.ts` owns Adelaide timezone formatting and conversion helpers.
- `src/utils/email.ts`, `src/utils/admin-email.ts`, and `src/utils/email-tracking.ts` own email rendering, sending, and tracking.
- `src/utils/*pdf-generator*.ts` owns PDF/report generation.
- `db/schema.sql` and `scripts/` own schema baseline and migrations.

## Core Rules

- Preserve Oak route/controller patterns.
- Keep admin-only work behind `requireAdminAuth`.
- Keep database access through initialized pools using `getPool()` or `getAuthPool()`.
- Use parameterized SQL queries; never interpolate user input into SQL.
- Preserve Adelaide timezone behavior and use timezone helpers where possible.
- Keep server-rendered templates in the existing TypeScript/HTML style.
- Keep frontend behavior in vanilla JS unless the project deliberately changes direction.
- Record sent emails and attachments when extending email workflows.
- Add migration scripts and update `db/schema.sql` when schema changes are required.

## Refactor Triggers

Treat these as signs that structure should be improved as part of the task:

- The same SQL shape, date formatting, shift mapping, email rendering, or template block appears in multiple places.
- A route handler contains routing, validation, SQL, business rules, and rendering all together.
- A template embeds business rules that belong in a controller or utility.
- Client JS duplicates fetch/error/toast behavior already handled elsewhere.
- Timezone handling is repeated or manually reconstructed.
- Email or PDF code creates similar shift previews in separate formats without a shared formatter.
- Shift assignment, unfilled shift, swap, or removal logic is split across places without an obvious owner.

## Procedure

1. Identify the responsibility being changed.
   - State what the route, controller, utility, template, or script should own.
   - If that sentence includes multiple concerns, look for a split.

2. Read nearby code first.
   - Inspect caller routes, controller helpers, templates, SQL queries, and sibling workflows.
   - Check whether a helper already exists before adding one.

3. Choose the smallest useful boundary improvement.
   - Keep local edits local when the boundary is clean.
   - Extract shared behavior when it removes real duplication or prevents a fragile one-off.
   - Avoid broad rewrites unrelated to the user request.

4. Extract by responsibility.
   - Move repeated formatting into utilities or presenters.
   - Move workflow-specific SQL helpers near the controller only when they are not broadly reusable.
   - Move shared database or connection behavior into existing DB utilities.
   - Move reusable UI markup into template helpers or components only when multiple pages use it.
   - Move email/PDF shared display logic into a utility if the same shift summary must stay consistent.

5. Keep interfaces explicit.
   - Use TypeScript interfaces for template data and utility inputs.
   - Keep returned data shaped for the caller, not for accidental implementation detail.
   - Avoid leaking database row quirks into templates when a controller can normalize them.

6. Update callers and remove old paths.
   - Replace duplicated code with the extracted function.
   - Remove dead helpers and superseded branches.
   - Keep imports tidy and avoid unrelated churn.

7. Verify the behavior.
   - Run `deno check src/main.ts`.
   - For route/controller work, test the changed route at `http://127.0.0.1:8044` when feasible.
   - For database changes, run the relevant migration path against a local PostgreSQL instance when available.

## Decision Rules

- If duplicated code handles Adelaide times, centralize or align it with `src/utils/timezone.ts`.
- If duplicated SQL can be shared safely, extract it only when the shared abstraction has a clear domain name.
- If a helper would hide important workflow differences, keep separate explicit code.
- If a template starts making business decisions, move those decisions into controller data preparation.
- If a controller becomes too large, extract focused helpers without changing route behavior.
- If email sending changes, keep tracking behavior aligned with `email-tracking.ts`.
- If schema changes are needed, add a migration under `scripts/` and update `db/schema.sql`.
- If a refactor touches auth, email delivery, database schema, or shift assignment logic, explain verification and residual risk.

## Quality Bar

Before finishing, confirm that:

- each changed module has one clear responsibility
- shared behavior lives in one clear place
- database access remains parameterized
- Adelaide timezone behavior is preserved
- admin auth boundaries are unchanged or strengthened
- templates receive display-ready data where practical
- the next similar feature can extend the structure without copying a whole workflow
