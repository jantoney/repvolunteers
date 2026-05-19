---
name: ui-copy-generator
description: Generate, rewrite, or review RepVolunteers user-facing copy for admin screens, volunteer self-service pages, emails, PDFs, toasts, errors, empty states, headings, labels, and CTAs. Use when wording needs to be clearer, shorter, more theatre-volunteer appropriate, better matched to the existing server-rendered UI voice, or aligned with production/performance/shift terminology.
---

# UI Copy Generator

Write RepVolunteers copy that is plain, calm, practical, and easy to scan on
mobile.

This skill is for wording, tone, labels, messages, and user-facing text. It is
not a general implementation skill, though copy changes may be made directly in
TypeScript HTML templates, vanilla JS, email templates, and PDF utilities.

## Product Context

- The app manages theatre volunteer shifts for Adelaide Rep Theatre.
- Admin users manage productions, performances, volunteers, shifts, assignments,
  schedules, unfilled shifts, PDFs, and emails.
- Volunteers receive personal login links, view available shifts, sign up, swap
  shifts, remove themselves from shifts, and download schedules.
- Volunteer-facing copy must be simple, reassuring, and mobile friendly.
- Admin copy can be more operational, but should still avoid implementation
  language.

## Naming

- Use `RepVolunteers` for the product when naming the app externally.
- Preserve existing product and section names when editing a nearby surface,
  including `Theatre Shifts`, `Theatre Shifts Admin`, `Participants`, `Shifts`,
  `Unfilled`, and `Bulk Email`.
- Use `volunteer` for public-facing volunteer copy unless the existing admin
  surface intentionally says `participant`.
- Use `production` for the overall theatre work stored in `shows`.
- Use `performance` for one dated event of a production stored in `show_dates`.
  Avoid `performance date` unless the date itself is the focus.
- Use `shift` for one volunteer role within a performance.
- Avoid using `show` in admin UI for the production/performance model. Preserve
  `Show Week` as the name of the email campaign.
- Use `run sheet`, `schedule`, `login link`, and `volunteer` consistently with
  nearby code and screens.
- Refer to times as Adelaide time only when it affects user action or avoids
  ambiguity.

## Voice

- Prefer direct, helpful wording over formal or technical phrasing.
- Tell the user what happened and what to do next.
- Keep labels short and literal.
- Keep toasts and errors concise.
- Avoid backend terms such as API, database, query, token, Better Auth, session
  object, status code, schema, or migration.
- Avoid exposing implementation details about timezone conversion, storage, PDF
  generation, email tracking, or auth flow.
- Do not add explanatory helper text by default. First try to make the heading,
  label, or button clear.
- Do not repeat information already shown in adjacent fields, table columns, or
  action buttons.

## Surface Guidance

- **Admin pages:** Use compact operational copy. Admins are coordinating
  productions, performances, and shifts, so prioritize clarity, status, and next
  actions.
- **Volunteer pages:** Use friendly but brief copy. Avoid administrative jargon
  and avoid making volunteers understand internal assignment rules.
- **Email copy:** Make the purpose obvious in the subject and first paragraph.
  Keep shift details scannable. Include direct next steps and contact context
  where needed.
- **PDF copy:** Use concise headings and labels. PDFs are reference material;
  avoid long explanations.
- **Errors:** State the visible problem first, then recovery. Example:
  `We could not load this volunteer. Please try again.`
- **Success:** Confirm the completed action. Example: `Shift assigned.`
- **Empty states:** Explain what is missing and, for admins, the next useful
  action. Example: `No performances have been added for this production.`
- **Confirmations:** Name the irreversible or important action plainly. Example:
  `Remove this volunteer from the shift?`

## Procedure

1. Identify the audience and surface.
   - Decide whether the copy is for an admin, a volunteer, an email recipient,
     or a PDF reader.
   - Check nearby templates or utilities before changing tone or terminology.

2. Identify the user-facing outcome.
   - State what happened, what it means, and whether the user can act.
   - Remove details that only describe the code path.

3. Choose the message shape.
   - Use short labels for buttons, tabs, fields, and table columns.
   - Use one sentence for most toasts and inline states.
   - Use two sentences only when the next step is not obvious.

4. Draft in product language.
   - Prefer verbs such as `Add`, `Save`, `Update`, `Send`, `Remove`, `Download`,
     `View`, `Assign`, and `Try again`.
   - For admin production/performance screens, prefer labels like `Production`,
     `Performances`, `Select Production`, `Add Performance`, and
     `Performance Intervals`.
   - Prefer `Log in` for the action and `login link` for the noun phrase if
     matching existing copy.
   - Keep volunteer copy human, but not chatty.

5. Tighten.
   - Remove duplicate ideas, filler, and layout narration.
   - Replace internal or technical phrases with user-facing consequences.
   - Check that button text fits mobile layouts.

6. Implement consistently when editing files.
   - Server-rendered admin views live under `src/views/admin/`.
   - Admin template fragments live under `src/views/admin/templates/`;
     page-specific admin scripts live beside them under `src/views/admin/*.js`.
   - Volunteer views and flows are under `src/controllers/volunteer.ts`,
     `src/routes/volunteer.ts`, and related templates.
   - Email copy is mostly in `src/utils/email.ts`, `src/utils/admin-email.ts`,
     and `src/views/email/`.
   - PDF wording is in `src/utils/*pdf-generator*.ts`.

## Decision Rules

- If a message mentions a failed request or status code, rewrite it as a
  user-visible problem.
- If copy explains how data is stored or converted, remove it unless the user
  must act on that fact.
- If a volunteer-facing message says `participant`, consider `volunteer` unless
  the surrounding screen is intentionally admin-only.
- If admin copy says `show` and means the overall work, use `production`. If it
  means one dated event, use `performance`.
- If a message says `show date`, rewrite it as `performance` unless the user
  must distinguish the calendar date from the event.
- If a CTA says `Submit`, replace it with the actual action.
- If an error can be fixed by retrying, say `Please try again.`
- If an action affects an email or schedule, name the recipient or schedule
  where space allows.
- If a destructive action is involved, make the confirmation specific.

## Output Patterns

- Single recommendation: provide the final wording and where it should go.
- Rewrite set: show `Before` and `After`.
- Option set: provide 2 to 4 options with short tradeoffs.
- Full surface pass: cover heading, labels, CTA, empty state, success, and error
  copy together.

## Completion Check

Before finishing, confirm that the copy:

- fits RepVolunteers and Adelaide Rep Theatre volunteer scheduling
- matches nearby terminology
- is understandable without technical context
- is short enough for mobile screens, buttons, emails, and PDFs
- tells the user what happened or what to do next
- avoids implementation detail and duplicate explanation
