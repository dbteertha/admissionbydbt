# Admission by DBT — Tracker Standalone

This directory is a byte-for-byte extraction of the live Tracker runtime and Google OAuth endpoints from the main Admission project.

Production architecture:
- This directory is deployed as its own Vercel project.
- The main Admission project proxies /tracker and /api/google-* to this project so the public origin remains unchanged.
- Keeping the original origin preserves existing localStorage data and HttpOnly Google session cookies without migration.
- Tracker UI/state/schema/Google Sheets behavior must not be modified during the separation.

Required environment variables:
- GOOGLE_CLIENT_SECRET
- SESSION_SECRET

The OAuth redirect URI intentionally remains:
https://admissionbydbt.vercel.app/api/google-callback
