# Il Bisonte NYC — Store Operations

A small internal workspace for the New York store. The simplified interface keeps only the areas staff use every day, while retaining the original Google Sheets/Apps Script backend and all historical records.

## Current interface

- **Overview:** a concise list of current store tasks, open items, and quick partner cards.
- **Activities:** prioritized work, waiting items, completed history, and store requests. Authorized PM staff can create, edit, and complete tasks.
- **Partners:** dedicated live-data cards for eMazzanti, RIS, Deda Group, Retail Pro Support, Spectrum, Verizon, and other providers. Missing information is labeled rather than invented. Authorized PM staff can edit existing vendor cards.
- **Store systems:** business-owned systems and any inventory returned by the backend.
- **Documents:** links to the operational Sheets and existing procedure references.
- **My work & hours:** preserves the original PM_WORKLOG module, including dates, logged hours, on-site/remote work, flat fees, amounts, invoice state, and its live create/edit flow. Visible to PM and management roles, not store staff.

The visual and navigation overhaul is implemented in `simple-hub.js` and `simple-hub.css`. The earlier UI modules are retained in Git history and in the repository for rollback, but they are no longer loaded by `index.html`.

## Data safety

The existing `TASKS`, `REQUESTS`, `VENDORS`, `SYSTEMS`, `PM_WORKLOG` and other Sheets remain in place. No existing sheet or PM hour entry was deleted or migrated into a new schema. The frontend uses the existing `IBData` and `IBPMWorklog` APIs.

`PM_WORKLOG` is personal business and billing data: do not put worklog rows, credentials, passwords, or secrets in this public repository. The frontend relies on backend role and approval enforcement; hiding UI controls is not a replacement for server-side authorization. The vendor registry stores support context, not passwords.

## Deployment

The site remains a static application with no build command. Deploy the repository root as before. The PWA service-worker cache has a new version to fetch the streamlined assets.

Production config remains in `config.js`; the Apps Script backend and company-controlled Sheets do **not** need to be re-created for this UI update.

## Verification before store rollout

1. Sign in as PM; verify that current tasks and partner cards load from the real Sheet.
2. Create/edit a task, then reload and confirm persistence.
3. Open **My work & hours**; confirm historical records and test a permitted update without changing billing facts.
4. Sign in as Store Manager; confirm the personal worklog is absent and protected writes are denied by the backend.
5. Check the navigation, partner cards and forms on a phone as well as a desktop.

The legacy interface is recoverable from the commit before the simplified-hub branch.
