import {
  getAdminNavigation,
  getAdminScripts,
  getAdminStyles,
} from "./navigation.ts";

export interface AdminPageOptions {
  title: string;
  currentPage: string;
  body: string;
  head?: string;
  scripts?: string;
}

export function renderAdminPage(options: AdminPageOptions): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${options.title} - Theatre Shifts</title>
      <link rel="manifest" href="/manifest.webmanifest">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="Theatre Shifts">
      <link rel="apple-touch-icon" href="/icons/ios/180.png">
      <meta name="theme-color" content="#007bff">
      ${getAdminStyles()}
      ${options.head ?? ""}
    </head>
    <body>
      ${getAdminNavigation(options.currentPage)}
      ${options.body}
      ${options.scripts ?? ""}
      ${getAdminScripts()}
    </body>
    </html>
  `;
}
