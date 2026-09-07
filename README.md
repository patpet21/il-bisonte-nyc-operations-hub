# Il Bisonte NYC Operations Hub

Working prototype of a private internal operations and project-management portal for the Il Bisonte New York store.

## Current prototype

The branch contains a deployable static web application with three role-based experiences:

- **Store Manager** — report issues, create requests, view open items, vendors and quick procedures.
- **Project Manager** — PM Control Center, **My PM Work & Hours**, project portfolio, request/issue coordination, vendor register, systems, SOPs, improvement backlog and activity log.
- **Management** — executive dashboard, critical items, project portfolio and decision queue.

The prototype runs immediately in **DEMO** mode using browser localStorage. The data layer is isolated, so the UI does not need to be rebuilt when switching to the Google Sheets backend.

## Data architecture

Production path:

`Web UI -> Google Apps Script -> Google Sheets + Google Drive`

The Google Sheet schema is designed around these tables:

`REQUESTS`, `PROJECTS`, `TASKS`, `VENDORS`, `SYSTEMS`, `ASSETS`, `SOPS`, `DECISIONS`, `IMPROVEMENTS`, `ACTIVITY_LOG`, `USERS`, `CONFIG`, `PM_WORKLOG`.

### PM worklog

`PM_WORKLOG` is a Project Manager-only work and billing register. It stores work date/time, tracked hours, work mode, category, linked project, activity/description, stakeholders, billing type, rate, amount, invoice status, evidence reference and notes.

Create, update and delete actions are routed through Apps Script and require the existing `Manage_Projects` permission. Each production write also creates an audit event in `ACTIVITY_LOG`.

Historical work with unknown hours is intentionally left without an hour value rather than estimating time that cannot be reconstructed.

Credentials are deliberately **not stored** in this application. The system records credential ownership/location only; passwords belong in an approved corporate password manager.

## Switch from demo to Google Sheets

1. Create/deploy the Apps Script backend using both `apps-script/Code.gs` and `apps-script/PMWorklog.gs`.
2. Set Script Property `SPREADSHEET_ID` to the target Operations database.
3. Deploy the script as a Web App.
4. In `config.js` set:

```js
dataMode: "apps_script",
appsScriptUrl: "YOUR_APPS_SCRIPT_WEB_APP_URL"
```

The same front-end then reads/writes the company-controlled database. In DEMO mode, the PM worklog uses a local browser copy of the same initial records.

## Portability

No company-specific IDs or secrets are hard-coded in the UI. The demo environment can later be replaced by Il Bisonte-owned Google Workspace resources without redesigning the application.

## Deployment

The front-end requires no build command. `index.html` is the publish root and can be hosted as a static site.

Prototype version: **0.10.0**
