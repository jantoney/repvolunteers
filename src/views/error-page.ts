type ErrorPageAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type ErrorPageOptions = {
  status: number;
  title: string;
  message: string;
  actions?: ErrorPageAction[];
};

export function renderErrorPage({
  status,
  title,
  message,
  actions = [],
}: ErrorPageOptions): string {
  const renderedActions = actions.map((action) => {
    const className = action.variant === "secondary"
      ? "btn btn-secondary"
      : "btn";
    return `<a href="${action.href}" class="${className}">${action.label}</a>`;
  }).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${status} - Theatre Shifts</title>
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="theme-color" content="#007bff">
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8f9fa;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .error-shell {
          width: 100%;
          max-width: 560px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 2rem;
          text-align: center;
        }

        .status {
          color: #007bff;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 1rem;
          font-size: 2rem;
          line-height: 1.2;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 1rem;
          line-height: 1.6;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 1.75rem;
        }

        .btn {
          display: inline-block;
          padding: 0.75rem 1.25rem;
          border: 2px solid #007bff;
          border-radius: 6px;
          background: #007bff;
          color: white;
          font-size: 0.95rem;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .btn:hover {
          background: #0056b3;
          border-color: #0056b3;
        }

        .btn-secondary {
          background: white;
          color: #007bff;
        }

        .btn-secondary:hover {
          background: #007bff;
          border-color: #007bff;
          color: white;
        }

        @media (max-width: 520px) {
          body {
            align-items: flex-start;
            padding: 1rem;
          }

          .error-shell {
            padding: 1.5rem;
          }

          h1 {
            font-size: 1.6rem;
          }

          .actions {
            align-items: stretch;
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <main class="error-shell">
        <div class="status">${status}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        ${
    renderedActions ? `<div class="actions">${renderedActions}</div>` : ""
  }
      </main>
    </body>
    </html>
  `;
}
