import {
  assertFalse,
  assertStringIncludes,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";
import { renderBulkEmailTemplate } from "../src/views/admin/templates/bulk-email-template.ts";
import { renderDashboardTemplate } from "../src/views/admin/templates/dashboard-template.ts";
import { renderSettingsTemplate } from "../src/views/admin/templates/settings-template.ts";
import { renderVolunteersTemplate } from "../src/views/admin/templates/volunteers-template.ts";

Deno.test("admin dashboard template includes shell and calendar hooks", () => {
  const html = renderDashboardTemplate();

  assertStringIncludes(html, "/src/views/admin/styles/admin-base.css");
  assertStringIncludes(html, 'id="calendar"');
  assertStringIncludes(html, "/src/views/admin/dashboard.js");
  assertStringIncludes(html, "/src/views/admin/admin-shell.js");
  assertFalse(html.includes("Database Maintenance"));
});

Deno.test(
  "admin settings template includes database maintenance controls",
  () => {
    const html = renderSettingsTemplate();

    assertStringIncludes(html, "Database Maintenance");
    assertStringIncludes(
      html,
      "Do not touch these tools unless you know what you are doing.",
    );
    assertStringIncludes(html, 'id="runMigrationsBtn"');
    assertStringIncludes(html, "/src/utils/modal.js");
    assertStringIncludes(html, "/src/views/admin/settings.js");
    assertStringIncludes(html, "/src/views/admin/admin-shell.js");
  },
);

Deno.test(
  "admin volunteers template escapes volunteer content and includes actions",
  () => {
    const html = renderVolunteersTemplate({
      volunteers: [
        {
          id: 7,
          name: "A <Volunteer>",
          email: "a@example.com",
          phone: "0400 000 000",
          approved: true,
        },
      ],
    });

    assertStringIncludes(html, "A &lt;Volunteer&gt;");
    assertStringIncludes(html, "actions-menu-7");
    assertStringIncludes(html, "Email Schedule PDF");
    assertStringIncludes(html, "Availability Request");
    assertStringIncludes(html, "/src/views/admin/volunteers.js");
    assertStringIncludes(html, "/src/views/admin/admin-dom.js");
  },
);

Deno.test("admin bulk email template uses external page script", () => {
  const html = renderBulkEmailTemplate();

  assertStringIncludes(html, 'id="showVolunteersList"');
  assertStringIncludes(html, 'id="availabilityVolunteersList"');
  assertStringIncludes(html, "/src/views/admin/bulk-email.js");
  assertStringIncludes(html, "/src/views/admin/admin-shell.js");
});
