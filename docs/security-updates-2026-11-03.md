# Security updates — 3 November 2026

Updated Deno 2.3.3 in the deployed image / 2.3.4 in source to 2.9.8, Better Auth 1.2.10 to 1.7.15, and jsPDF 2.5.2 to 4.2.1. The Docker build also applies the Alpine branch's available package updates. Excluded `.env` and `.env.*` from the image build context.

Better Auth now keeps provider identity in the raw Microsoft profile instead of the mapped local-user object. Retained Microsoft's stable `oid` and reject profiles without it. The existing Microsoft group checks and disabled password sign-in remain. The Deno HTTP listener explicitly binds the container interface, preserving Docker port forwarding with the newer runtime's loopback default.

The original lockfile audit reported 56 advisories: 4 critical, 24 high, 20 moderate and 8 low. The updated lockfile reports one low advisory in transitive deepmerge (GHSA-gcqx-w48m-w2h4), with no moderate, high or critical advisories. Counts do not establish whether each advisory is reachable in this application. Recheck upstream fixes; do not claim zero vulnerabilities.

Validation used an isolated PostgreSQL 17 database with synthetic settings and no email credentials:

- Deno type check and production Docker build passed.
- Baseline migration and both release-workflow additive migrations passed.
- Public homepage and admin login returned 200; anonymous dashboard returned 403; session endpoint returned 401.
- Microsoft sign-in initiation returned its normal authorisation URL with PKCE/state and a state cookie. An untrusted origin/callback was rejected with 403; password sign-in and registration remained disabled.
- A synthetic performance run sheet rendered as a valid PDF through jsPDF 4.2.1.
- `deno audit` reports one low advisory.

The external Microsoft callback and an interactive sign-in were not exercised with real credentials during isolated testing. No volunteer data, shifts, emails or real identity-provider settings were changed. Source base verified before PR: d5c49aa4f93b1c1eafcc205f8c96ecee2e9463ae.

Before deployment, the live image was preserved on the server as `theatre-app:before-security-20261103`. Use the standard GitHub Actions build/deploy workflow; verify the running runtime and public/protected routes after it completes. No new production schema migration is introduced by this release.
