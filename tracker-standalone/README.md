# DBT Tracker — Standalone

This directory is an exact standalone runtime copy of the existing Study Tracker.

## Zero-change guarantees
- Tracker HTML/CSS/JS source is copied byte-for-byte from `api/tracker.js`.
- All existing localStorage keys remain unchanged.
- Google OAuth routes are copied byte-for-byte.
- AES-256-GCM session cookie behavior remains unchanged.
- Google Sheets synchronization behavior remains unchanged.
- Existing public path compatibility is preserved at `/tracker` and its subroutes.

## Deployment model
Deploy this directory as its own Vercel project, then proxy the existing
`admissionbydbt.vercel.app/tracker` and `/api/google-*` paths to that project.
Keeping the original browser origin preserves all existing localStorage and cookies.

Required environment variables on the standalone project:
- GOOGLE_CLIENT_SECRET
- SESSION_SECRET

Do not change the Google OAuth redirect URI while the original admissionbydbt origin remains the public proxy.
