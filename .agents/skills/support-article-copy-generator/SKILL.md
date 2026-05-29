---
name: support-article-copy-generator
description: Create, rewrite, or review RepVolunteers Help and support articles. Use when drafting article titles, tags, summaries, step-by-step instructions, FAQ answers, troubleshooting guidance, navigation explanations, timezone explanations, or any support content that must be simple, searchable, user-facing, and accessible for admins or volunteers, including users with intellectual disabilities.
---

# Support Article Copy Generator

Write RepVolunteers support articles that help users complete real tasks without
needing to understand how the app is built.

The article must be simple enough for a first-time user, a busy theatre admin,
a volunteer on a phone, or a user with an intellectual disability.

## Core Standard

Every article should be:

- task-focused
- short
- searchable by title and tags
- easy to scan
- written in plain language
- free of backend, code, database, API, auth, schema, helper, or implementation
  details
- clear about what the user can see, click, choose, send, download, or change

If a sentence explains how the system works internally, rewrite it as what the
user sees or what the user should do.

Example:

- Avoid: `The app uses Adelaide timezone helpers instead of browser-local date formatting.`
- Use: `Times in the app are shown in Adelaide time, even if your phone or computer is set to another timezone.`

## Article Shape

Prefer this structure for most support articles:

```markdown
Title: Clear task or topic name
Tags: tag, tag, tag

Short answer:
One or two sentences that answer the main question.

Steps:
1. Do this.
2. Do this.
3. Do this.

Notes:
- Helpful detail only if the user needs it.

What to do if it does not work:
- One clear recovery action.
```

Use only the sections that help. Do not add empty sections.

For reference articles, use:

```markdown
Title: Plain topic name
Tags: tag, tag, tag

What this means:
Brief explanation.

Where to find it:
Short location in the app.

What you can do:
- Action or fact
- Action or fact
```

## Writing Rules

- Use common words.
- Use short sentences. Aim for 15 to 20 words.
- Keep paragraphs to one idea.
- Use `you` when giving instructions.
- Use active voice.
- Use numbered steps for actions that must happen in order.
- Use bullets for lists that do not have an order.
- Start each step with a verb: `Open`, `Select`, `Choose`, `Check`, `Save`.
- Name buttons and menu items exactly as they appear in the app.
- Define unavoidable terms the first time they appear.
- Keep article titles action-based where possible, such as `Add a Volunteer`.
- Keep tags lowercase and searchable, such as `volunteers`, `shifts`, `email`.
- Link related articles when useful, but do not make users read another article
  to finish the current task.

## Cognitive Accessibility

Write so users do not need to remember hidden information.

- Put important facts in the article, not only in links or tooltips.
- Avoid long setup explanations.
- Avoid idioms, jokes, sarcasm, and vague reassurance.
- Avoid words like `simply`, `obviously`, `just`, or `easy`.
- Avoid saying what users "should already know".
- Use concrete locations: `top menu`, `Shifts page`, `Save button`.
- If there is a warning, say what may happen and what to do.
- If there is an error, say the problem and the next step.
- If a user might be unsure, include one example.
- Do not rely on color or position alone. Avoid instructions like `click the green button`.

## RepVolunteers Terminology

- Use `RepVolunteers` for the app when naming it externally.
- Use `Theatre Shifts Admin` when matching the admin header.
- Use `production` for the overall theatre work.
- Use `performance` for one dated event of a production.
- Use `shift` for a volunteer role within a performance.
- Use `volunteer` for volunteer-facing copy.
- Use `participant` only when matching the admin UI label.
- Use `login link`, `schedule`, `run sheet`, `unfilled shifts`, and `Show Week`
  consistently with the app.
- Refer to Adelaide time when times are part of the user's decision.

## What To Remove

Remove or rewrite:

- code names unless they are visible in the UI
- route names, file names, database table names, environment variables, and
  helper function names
- phrases like `backend`, `API`, `database`, `query`, `token`, `session`,
  `schema`, `migration`, `server-side`, `client-side`, or `browser-local`
- explanations about how PDFs, emails, auth, timezones, or records are generated
- long history or developer notes unless they help the user use the app

Developer context can become a short user note.

Example:

- Source idea: `The developer added the top-bar time because they live outside Adelaide.`
- Article wording: `The time in the top bar shows Adelaide time, so schedules match the theatre.`

## Search Tags

Use 3 to 8 tags. Prefer words users might type into search.

Good tags:

- `navigation`
- `menu`
- `dashboard`
- `productions`
- `performances`
- `shifts`
- `volunteers`
- `participants`
- `email`
- `schedule`
- `pdf`
- `timezone`
- `adelaide`
- `login`
- `settings`

Avoid tags that only developers would search for, such as `show_dates`,
`participant_shifts`, `auth`, `api`, or `timestamptz`.

## Article Types

Use the right shape for the job.

**How-to**

- Use when the user needs to complete a task.
- Include a short answer and numbered steps.
- End with a simple recovery step.

**Reference**

- Use when explaining a page, menu item, status, or field.
- Use short definitions and "what you can do" bullets.

**Troubleshooting**

- Use when something can go wrong.
- Start with the visible problem.
- Give the most likely fix first.
- Include when to contact an admin or support person.

**FAQ**

- Use when the answer is short.
- Keep one question per article or section.

## Procedure

1. Identify the audience.
   - Admins manage productions, performances, volunteers, shifts, PDFs, and
     emails.
   - Volunteers view available shifts, sign up, swap shifts, remove themselves
     from shifts, and download schedules.

2. Identify the user goal.
   - Write the article around what the user wants to do or understand.
   - Do not organize around how the app stores or processes information.

3. Draft the title and tags.
   - Make the title match likely search words.
   - Add tags for the page, feature, synonym, and action.

4. Write the short answer first.
   - Put the main point at the top.
   - If the user reads only this part, they should understand the article.

5. Add steps or reference sections.
   - Use visible UI names.
   - Keep each step to one action.
   - Avoid optional details inside required steps.

6. Add notes only when needed.
   - A note must help the user make a decision or avoid a mistake.
   - Remove notes that only explain development history.

7. Add a recovery path.
   - Say what to check, retry, or who to contact.
   - Keep it calm and specific.

8. Tighten.
   - Remove duplicate ideas.
   - Replace jargon with user-facing words.
   - Split long paragraphs.
   - Check that the article works on a phone.

## Quality Checklist

Before finishing, confirm:

- the title clearly names the task or topic
- the tags include likely search words
- the first paragraph gives the answer
- steps are numbered only when order matters
- each step has one action
- the article uses visible app wording
- the article avoids implementation details
- the article uses production, performance, shift, volunteer, and participant
  correctly
- Adelaide time is explained as a user-visible rule, not a technical process
- a user with an intellectual disability can follow the content without needing
  memory, inference, or technical knowledge

## Output Patterns

When drafting a new article, provide:

```markdown
Title:
Tags:

Article:
...
```

When rewriting an article, provide:

```markdown
Title:
Tags:

Rewritten article:
...

Notes on changes:
- ...
```

When reviewing an article, lead with the most important issues:

```markdown
Findings:
- ...

Suggested rewrite:
...
```
