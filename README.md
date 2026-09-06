# Il Bisonte NYC Operations Hub

Working prototype of a private internal operations and project-management portal for the Il Bisonte New York store.

## Current prototype

The branch contains a deployable static web application with three role-based experiences:

- **Store Manager** — report issues, create requests, view open items, vendors and quick procedures.
- **Project Manager** — project portfolio, request/issue coordination, vendor register, systems, SOPs, improvement backlog and activity log.
- **Management** — executive dashboard, critical items, project portfolio and decision queue.

The prototype runs immediately in **DEMO** mode using browser localStorage. The data layer is isolated in `data-provider.js`, so the UI does not need to be rebuilt when switching to the Google Sheets backend.

## Data architecture

Production path:

`Web UI -> Google Apps Script -> Google Sheets + Google Drive`

The Google Sheet schema is designed around these tables:

`REQUESTS`, `PROJECTS`, `TASKS`, `VENDORS`, `SYSTEMS`, `ASSETS`, `SOPS`, `DECISIONS`, `IMPROVEMENTS`, `ACTIVITY_LOG`, `USERS`, `CONFIG`.

Credentials are deliberately **not stored** in this application. The system records credential ownership/location only; passwords belong in an approved corporate password manager.

## Switch from demo to Google Sheets

1. Create/deploy the Apps Script backend from `apps-script/Code.gs`.
2. Set Script Property `SPREADSHEET_ID` to the target Operations database.
3. Deploy the script as a Web App.
4. In `config.js` set:

```js
dataMode: "apps_script",
appsScriptUrl: "YOUR_APPS_SCRIPT_WEB_APP_URL"
```

The same front-end then reads/writes the company-controlled database.

## Portability

No company-specific IDs or secrets are hard-coded in the UI. The demo environment can later be replaced by Il Bisonte-owned Google Workspace resources without redesigning the application.

## Deployment

The front-end requires no build command. `index.html` is the publish root and can be hosted as a static site.

Prototype version: **0.1**
