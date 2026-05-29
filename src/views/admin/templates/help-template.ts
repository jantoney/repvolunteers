import { renderAdminPage } from "../components/layout.ts";

interface HelpArticle {
  title: string;
  tags: string[];
  html: string;
}

const helpArticles: HelpArticle[] = [
  {
    title: "App Navigation",
    tags: [
      "navigation",
      "menu",
      "dashboard",
      "productions",
      "performances",
      "shifts",
      "participants",
      "settings",
      "time",
    ],
    html: `
      <p>Use the top menu to move between the main admin pages.</p>
      <h3>What each menu item does</h3>
      <dl class="article-definition-list">
        <div>
          <dt>Dashboard</dt>
          <dd>Shows the shift calendar and important shift counts, such as unfilled shifts and performances without shifts.</dd>
        </div>
        <div>
          <dt>Productions</dt>
          <dd>Use this to view productions, add a production, edit production details, and manage performances.</dd>
        </div>
        <div>
          <dt>Shifts</dt>
          <dd>Use this to view shifts, add shifts, edit shifts, and check unfilled shifts.</dd>
        </div>
        <div>
          <dt>Participants</dt>
          <dd>Use this to add and edit volunteers, view volunteer shifts, and send emails.</dd>
        </div>
        <div>
          <dt>Help</dt>
          <dd>Use this to find support articles about the app.</dd>
        </div>
        <div>
          <dt>Current time</dt>
          <dd>The time in the top bar shows Adelaide time, so schedules match the theatre.</dd>
        </div>
        <div>
          <dt>Settings</dt>
          <dd>Use this for admin settings and maintenance tools. If you are unsure, ask before using these tools.</dd>
        </div>
        <div>
          <dt>Logout</dt>
          <dd>Use this when you have finished. It signs you out of the admin area.</dd>
        </div>
      </dl>
      <h3>If you cannot find a page</h3>
      <p>Open the top menu and choose the section that best matches your task. For example, choose Shifts when you need to add or change a shift.</p>
    `,
  },
  {
    title: "App Timezone",
    tags: ["timezone", "adelaide", "time", "performances", "shifts", "dates"],
    html: `
      <p>RepVolunteers shows performance and shift times in Adelaide time.</p>
      <h3>What this means</h3>
      <ul class="article-list">
        <li>The time shown in the app matches Adelaide Rep Theatre.</li>
        <li>Your phone or computer may be set to another timezone.</li>
        <li>The app still shows Adelaide time for performances and shifts.</li>
      </ul>
      <h3>Where this matters</h3>
      <ul class="article-list">
        <li>Performance times</li>
        <li>Shift start and finish times</li>
        <li>Volunteer schedules</li>
        <li>PDFs and emails that include times</li>
      </ul>
      <h3>If a time looks wrong</h3>
      <p>Check the time against Adelaide time first. If it still looks wrong, ask an admin to check the performance or shift details.</p>
    `,
  },
];

function getArticleId(title: string): string {
  return title.toLowerCase().replaceAll(" ", "-");
}

function renderTags(tags: string[]): string {
  return tags.map((tag) => `<span class="help-tag">${tag}</span>`).join("");
}

function getHelpTags(): string[] {
  return Array.from(new Set(helpArticles.flatMap((article) => article.tags)))
    .sort((first, second) => first.localeCompare(second));
}

function renderTagList(): string {
  return getHelpTags()
    .map((tag) =>
      `<li>
        <button class="help-tag-filter" type="button" data-help-tag="${tag}" aria-pressed="false">${tag}</button>
      </li>`
    )
    .join("");
}

function renderArticles(): string {
  return helpArticles
    .map((article) =>
      `<article class="help-article" id="${
        getArticleId(article.title)
      }" data-help-article data-help-name="${article.title.toLowerCase()}" data-help-tags="${
        article.tags.join(" ").toLowerCase()
      }">
        <header class="help-article-header">
          <h2>${article.title}</h2>
          <div class="help-card-tags">${renderTags(article.tags)}</div>
        </header>
        <div class="help-article-body">
          ${article.html}
        </div>
      </article>`
    )
    .join("");
}

export function renderHelpTemplate(): string {
  return renderAdminPage({
    title: "Help",
    currentPage: "help",
    head: `
      <style>
        .help-layout {
          display: grid;
          grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
          gap: 1.5rem;
          align-items: start;
        }

        .help-panel,
        .help-article,
        .help-empty {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .help-panel {
          position: sticky;
          top: 76px;
          padding: 1.25rem;
        }

        .help-search-label {
          font-size: 0.95rem;
        }

        .help-search {
          margin-bottom: 1rem;
        }

        .help-results-summary {
          color: #666;
          font-size: 0.9rem;
          margin: 0 0 1rem 0;
        }

        .help-list {
          list-style: none;
          display: grid;
          gap: 0.875rem;
        }

        .help-tag-filter {
          width: 100%;
          min-height: 2.25rem;
          padding: 0.45rem 0.75rem;
          border: 1px solid #d7e8fb;
          border-radius: 6px;
          background: #f8fbff;
          color: #0056b3;
          cursor: pointer;
          font: inherit;
          font-weight: 600;
          line-height: 1.2;
          text-align: left;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .help-tag-filter:hover,
        .help-tag-filter:focus-visible {
          background: #eef6ff;
          border-color: #8fc3ff;
        }

        .help-tag-filter.active {
          background: #007bff;
          border-color: #007bff;
          color: white;
        }

        .help-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.375rem;
        }

        .help-tag {
          display: inline-flex;
          align-items: center;
          min-height: 1.5rem;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          background: #eef6ff;
          color: #0056b3;
          font-size: 0.8rem;
          line-height: 1.2;
        }

        .help-articles {
          display: grid;
          gap: 1.5rem;
        }

        .help-article {
          overflow: hidden;
        }

        .help-article-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .help-article-header h2 {
          color: #333;
          font-size: 1.5rem;
          margin: 0;
        }

        .help-article-body {
          color: #333;
          padding: 2rem;
        }

        .help-article-body p {
          margin: 0 0 1rem 0;
        }

        .help-article-body p:last-child {
          margin-bottom: 0;
        }

        .help-article-body h3 {
          color: #333;
          font-size: 1.1rem;
          margin: 1.25rem 0 0.5rem 0;
        }

        .help-article-body h3:first-child {
          margin-top: 0;
        }

        .article-list {
          margin: 0 0 1rem 1.25rem;
          padding: 0;
        }

        .article-list li {
          margin-bottom: 0.375rem;
        }

        .article-definition-list {
          display: grid;
          gap: 1rem;
          margin: 1rem 0 0 0;
        }

        .article-definition-list div {
          border-left: 3px solid #007bff;
          padding-left: 1rem;
        }

        .article-definition-list dt {
          color: #333;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .article-definition-list dd {
          color: #555;
          margin: 0;
        }

        .help-empty {
          display: none;
          color: #555;
          padding: 2rem;
        }

        .help-empty.visible {
          display: block;
        }

        @media (max-width: 768px) {
          .help-layout {
            grid-template-columns: 1fr;
          }

          .help-panel {
            position: static;
          }

          .help-article-header,
          .help-article-body {
            padding: 1rem;
          }
        }
      </style>
    `,
    body: `
      <div class="main-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Help</h1>
            <p class="page-subtitle">Search support articles and reference notes for RepVolunteers.</p>
          </div>
        </div>

        <div class="help-layout">
          <aside class="help-panel" aria-label="Help article search">
            <label class="help-search-label" for="helpSearch">Search by article name or tag</label>
            <input class="help-search" id="helpSearch" type="search" placeholder="Search help articles" autocomplete="off">
            <p class="help-results-summary" id="helpResultsSummary">${helpArticles.length} articles</p>
            <ul class="help-list" id="helpArticleList">
              ${renderTagList()}
            </ul>
          </aside>

          <div>
            <div class="help-empty" id="helpEmpty">No help articles match that search.</div>
            <div class="help-articles" id="helpArticles">
              ${renderArticles()}
            </div>
          </div>
        </div>
      </div>
    `,
    scripts: `<script src="/src/views/admin/help.js"></script>`,
  });
}
