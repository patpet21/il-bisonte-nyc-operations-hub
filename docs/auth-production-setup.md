# Production authentication activation

The application now contains the complete role-aware authentication flow. The remaining production activation requires account-level Google setup that is intentionally not stored in GitHub.

## Architecture

Google Identity Services → Netlify frontend → Apps Script API → Google Sheets `USERS` + `ROLE_PERMISSIONS`

No application login passwords are stored.

## Required Apps Script properties

- `SPREADSHEET_ID` = the Operations Hub database spreadsheet ID
- `GOOGLE_CLIENT_ID` = Google Web OAuth Client ID
- `AUTH_MODE` = `google`
- `ALLOWED_DOMAINS` = optional comma-separated allowed Google Workspace domains

## Frontend config

In `config.js`:

- set `dataMode` to `apps_script`
- set `appsScriptUrl` to the deployed Apps Script Web App URL
- set `auth.mode` to `google`
- set `auth.googleClientId` to the same Web OAuth Client ID
- set `environment` to `PRODUCTION`

## Google OAuth client

Create a Web application OAuth client in Google Cloud / Google Auth Platform and add the production site origins, for example:

- `https://operations.ilbisonte.propertydex.xyz`
- the Netlify site URL if it will also be used directly

The OAuth Client ID is public configuration. Do not place a client secret in the frontend.

## User lifecycle

1. User clicks Continue with Google.
2. Backend verifies the Google ID token and its audience.
3. Unknown user submits an access request.
4. `USERS` receives the verified email / Google subject and status `Pending`.
5. Project Manager, Management or IT Admin chooses the final role and approves/rejects.
6. Approved users receive their role from `USERS` and permissions from `ROLE_PERMISSIONS`.
7. Every protected backend action is checked server-side.

## Roles

- Store Manager
- Project Manager
- Management
- IT Admin
- Read Only

Role permissions are maintained in the `ROLE_PERMISSIONS` sheet so the company can change authorization without redeploying the frontend.
