# DBT Tracker — Standalone

This folder is a deployment-isolated copy of the existing DBT Tracker.

- `api/tracker.js` is copied byte-for-byte from the production Admission repo Tracker.
- Existing Tracker localStorage keys, routes, Google Sheets logic, PDF Studio, weekly/daily views, undo/history, and data guards are unchanged.
- The only domain adaptation is in Google OAuth login/callback routes so the callback uses the standalone deployment host.
- The original `/tracker` remains untouched until the standalone deployment is verified.

Required Vercel environment variables:
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`

Google OAuth must allow:
- `https://<standalone-domain>/api/google-callback`
