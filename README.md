# Varausjärjestelmä — Item reservation system 

Short description
- This is a Meteor-based item reservation system used to list items, make reservations, and manage maintenance and past reservations. It uses React for the client UI and Meteor for server-side publications and methods.

Quick facts
- Project name (from package.json):
- Frameworks: Meteor, React
- Main entry points:
  - Client: `client/main.jsx`
  - Server: `server/main.js`

Prerequisites
- Install Meteor (https://www.meteor.com/install) and a compatible Node.js version.
- On Windows, using WSL is recommended for the development shell.

Install and run (development)
1. Install npm dependencies:
   ```bash
   meteor npm install
   ```
2. Start the app:
   ```bash
   npm run start
   # which runs: meteor run
   ```
3. Run tests (optional):
   ```bash
   npm run test
   # or for full-app watch mode:
   npm run test-app
   ```

Project structure (key folders and files)
- `client/` — Client entry and UI assets
  - `main.jsx` — React client bootstrap
  - `main.css`, `main.html` — main static files
- `server/` — Server entry point and server-only code
  - `main.js` — Meteor server startup (publications, methods, etc.)
- `imports/` — Shared/importable code (modular Meteor style)
  - `api/` — Server and API logic for collections and publications:
    - `items.js` — item collection and publications
    - `links.js`
    - `maintenance.js`
    - `pastReservations.js`
    - `reservations.js`
- `ui/` — React components and pages
  - `App.jsx`, `Creds.jsx`, `Info.jsx`
  - `AdminPage/` — admin pages and forms
  - `Lists/` — item lists, reservation UIs, maintenance lists, past reservations
  - `MakeReservation/` — reservation creation UI
  - `Modals/`, `styles/`, `UserPage/` — supporting UI
- `public/` — Static assets (images, etc.)
- `packages/` — Local Meteor packages included in the project (e.g., `meteor-roles`, `react-meteor-data`)
- `deployToServer/` — Deployment helpers (e.g., `deploy.sh`, SSH keys)
- `lib/` — Native libs bundled into the project (library files)
- `tests/` — Test entry (`tests/main.js`)

Common tasks
- Add a feature UI: add components under `ui/`, wire them from `client/main.jsx` or `App.jsx`.
- Add a new collection/publication: create under `imports/api/`, then import and publish from `server/main.js`.
- Run tests: use `npm run test` (uses Meteor's mocha test driver).

Helpful commands (from repo root)
- Install deps: `meteor npm install`
- Start dev server: `npm run start`
- Run tests: `npm run test`
- Visualize bundle: `npm run visualize` (creates a production bundle visualizer)
