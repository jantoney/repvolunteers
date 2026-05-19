---
name: frontend-design
description: Design or implement RepVolunteers frontend surfaces using the existing server-rendered TypeScript HTML templates, inline/shared CSS, vanilla JavaScript, admin navigation, toast/modal utilities, PWA constraints, and mobile-friendly volunteer flows. Use for admin pages, volunteer self-service screens, responsive layout, accessibility, visual polish, forms, tables, dialogs, UI state work, and production/performance/shift UI consistency.
---

# Frontend Design

Design and build RepVolunteers UI that fits the current Deno/Oak server-rendered
app. Do not introduce a frontend framework or new design system unless the user
explicitly asks.

## Codebase Frontend Model

- Pages are mostly TypeScript functions returning HTML strings.
- Admin templates live under `src/views/admin/` and
  `src/views/admin/templates/`.
- Admin shared navigation/styles/scripts come from
  `src/views/admin/components/navigation.ts`.
- Volunteer flows are handled through `src/routes/volunteer.ts`,
  `src/controllers/volunteer.ts`, and rendered templates.
- Frontend behavior uses vanilla JavaScript files under `src/views/admin/` and
  shared utilities under `src/utils/`.
- Toasts use `src/utils/toast.js` and `src/utils/toast.css`.
- Modals use `src/utils/modal.js`.
- PWA assets are served through `manifest.webmanifest`, `service-worker.js`, and
  icons. Do not touch icons unless asked.

## Domain Language In UI

- Admin UI should call the overall theatre work a `production`.
- A single dated event of a production is a `performance`.
- A `shift` is a volunteer role within one performance.
- Keep route names, CSS classes, form field names, and API paths such as
  `/admin/shows` or `show_date_id` unchanged unless the task is a deeper
  refactor.
- Preserve `Show Week` as the established email campaign name.

## Visual Direction

- Preserve the existing practical admin style: blue primary actions, neutral
  grey surfaces, simple cards/forms/tables, compact spacing, and clear
  hierarchy.
- Keep volunteer-facing screens simple, readable, and touch friendly.
- Use the existing `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`,
  `.form-group`, `.form-container`, `.page-header`, and related patterns where
  available.
- Avoid decorative redesigns, marketing-style hero sections, framework-specific
  components, and large visual departures from the current app.
- Keep cards and panels functional. Use them for forms, repeated records, and
  modal content, not as decoration.

## Procedure

1. Identify the surface.
   - Determine whether the change is admin, volunteer, email preview,
     PDF-adjacent, or shared utility UI.
   - Read the nearest existing template and any linked JS before editing.
   - For admin production/performance work, inspect both the TypeScript template
     and its page-specific JS because copy is split across both.

2. Preserve the rendering pattern.
   - For server-rendered pages, keep HTML in TypeScript template functions.
   - For client interaction, use vanilla JS matching existing files.
   - Reuse shared admin navigation/styles/scripts where the page belongs in
     admin.

3. Design mobile-first where volunteers are involved.
   - Check small viewport layout for signup, shift selection, swap, removal, and
     schedule pages.
   - Keep tap targets usable and forms easy to complete on a phone.
   - Avoid horizontal overflow in tables and shift cards.

4. Make admin workflows efficient.
   - Admin pages are repeated-use operational tools; favor scanability and
     predictable controls.
   - Keep key actions close to the records they affect.
   - Use tables for dense lists and cards/forms where editing or grouping is
     clearer.
   - Keep production filters, performance groupings, and shift actions visually
     distinct.

5. Implement clear states.
   - Include loading, success, error, empty, disabled, and confirmation states
     where relevant.
   - Reuse `Toast` for transient feedback when the page already loads the toast
     utility.
   - Reuse the modal utility for confirmations and focused interactions where
     practical.

6. Keep accessibility built in.
   - Use semantic HTML before ARIA.
   - Associate labels with inputs.
   - Preserve keyboard navigation for forms, buttons, links, modals, and
     dropdowns.
   - Maintain visible focus states and sufficient contrast.
   - Use button elements for actions and links for navigation.

7. Respect data and timezone constraints.
   - Do not format Adelaide performance or shift times ad hoc in UI code when
     helpers already exist.
   - Use `src/utils/timezone.ts` conventions for TypeScript-side date/time
     display or input values.
   - Be careful with `datetime-local` fields: nearby code treats entered times
     as Adelaide local time.

8. Verify visually and functionally.
   - Run `deno check src/main.ts` after TypeScript template changes.
   - Use `http://127.0.0.1:8044` for local testing on this PC.
   - Manually check the changed route or page when feasible.

## Decision Rules

- If a page already uses `getAdminStyles()`, extend those classes before adding
  a separate style system.
- If a shared utility already exists for toast, modal, nav, date formatting, or
  PDF/email flow, reuse it.
- If a volunteer screen gets new controls, optimize for phone use first.
- If an admin table becomes hard to use on mobile, prefer responsive wrapping or
  stacked row detail over tiny text.
- If visible copy changes, use the `ui-copy-generator` skill to keep wording
  concise and local to this product.
- If UI work touches production/performance labels, scan the adjacent admin page
  for old `show`, `show date`, and `performance date` wording before finishing.
- If the work touches auth, email sending, database updates, or shift assignment
  behavior, verify the full flow more carefully and mention remaining risk.
- If the user asks for a redesign, keep the app recognizable unless they
  explicitly want a new visual identity.

## Quality Bar

Before finishing, confirm that:

- the UI matches the existing RepVolunteers admin or volunteer surface
- production, performance, and shift labels are used consistently on admin
  surfaces
- layout works on mobile and desktop
- forms have labels, useful states, and clear feedback
- actions are buttons and navigation is links
- no new framework or dependency was introduced without clear need
- the changed page can be reached at `http://127.0.0.1:8044` when the dev server
  is running
