# Folio

Describe yourself in plain words. Folio builds a personal website. Pick a style, change it by chatting, and publish it to your own `<username>.github.io`.

## Run

Everything in Docker (app + Postgres), on http://localhost:3000:

```bash
docker compose up --build
```

Local development with live reload, on http://localhost:5173:

```bash
npm install
npm run db       # Postgres in Docker, on port 5434
npm run mock     # no API key: canned chat replies
npm run dev      # real Claude calls, needs ANTHROPIC_API_KEY in .env
```

The API runs on port 3000 (`PORT` changes it). `DATABASE_URL` defaults to the Docker database. Tables are created at startup from `src/server/db/schema.sql`.

Checks: `npm run typecheck`, `npm test`.

### `.env`

```
ANTHROPIC_API_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
BASE_URL=http://localhost:5173
```

For publishing, create a GitHub OAuth app at https://github.com/settings/developers. Set the callback URL to `<BASE_URL>/auth/github/callback`. Docker Compose always uses `BASE_URL=http://localhost:3000`, so it needs an OAuth app with the callback `http://localhost:3000/auth/github/callback`.

## Data

Postgres keeps everything: users, sessions, CVs, versions (each chat turn with its site) and publishes.

- Every browser gets a user and a `sid` cookie on its first visit, so work is saved before login. GitHub login links that user to the GitHub account. On a second browser, login moves the work into the existing account.
- A user has one **main** CV and any number of **variants**. A variant is tailored to a job description. Tailoring may only reorder, hide and reword. The server lists anything the variant adds that the main CV does not have.
- The main CV publishes to the root of the GitHub Pages site. A variant publishes to `jobs/<name>/` on the same site.
- Each publish points to the version it was made from. The chat marks that version as Live, and the Publish button shows a dot when the site has changed since.
- "New chat" adds a version with `starts_chat`. The chat shows, and Claude reads, only the versions after the last one. Undo removes it and the earlier chat comes back.

## Design

The whole site is one JSON object, `Site` (`src/shared/site.ts`):

| Field | What it holds |
|---|---|
| `template` | Which template draws the page |
| `theme` | Accent color, font, light or dark. `null` means the template default |
| `sections` | Section order and hidden sections |
| `customCss` | Small visual tweaks on a built-in template |
| `design` | A full stylesheet the AI writes for the `custom` template, for looks no template gives ("Mondrian style") |
| `content` | The person's details, in JSON Resume format |

Templates are pure functions, `render(site) → html`. They are written once and run in two places: the browser (preview, thumbnails, publish) and the tests.

The AI never writes HTML. It reads the current `Site` and returns an updated one. `normalizeSite()` checks every `Site` that comes from the AI or from storage.

```
chat message ──► POST /api/chat ──► Claude ──► Site ──► normalizeSite ──► browser ──► renderSite ──► preview
style click  ─────────────────────────────────────────────────────────────► browser ──► renderSite ──► preview
Build my CV  ──► GET /api/github/profile (public repos) ──► POST /api/cvs/:id/chat + CV/LinkedIn PDF ──► Claude ──► Site
Tailor       ──► POST /api/cvs/tailor (job description) ──► Claude ──► new variant CV
Publish      ──► POST /api/cvs/:id/publish ──► server renders HTML ──► GitHub repo + Pages
```

## Layout

```
src/
  shared/              used by client, server and tests
    site.ts            Site type and normalizeSite()
    api.ts             request and response types
    templates/         html.ts (shared helpers), one file per template, sample.ts, tests
  server/              Hono API
    main.ts            app setup and error handling
    config.ts          environment
    errors.ts          UserError (shown to the user), GitHubLoginRequired, NotFound
    session.ts         sid cookie, anonymous users
    db/                pool.ts, schema.sql
    cv/                routes.ts (/api), store.ts (SQL)
    chat/              service.ts (entry), tailor.ts, prompt.ts, claude.ts, mock.ts
    github/            oauth.ts (login routes), publish.ts, profile.ts (public profile for import), client.ts
  client/              React app
    App.tsx            state and actions
    useWorkspace.ts    CVs and versions from the server
    api.ts             fetch wrappers
    components/        Landing, Header, CvMenu, Dropdown, icons, MessageList, TailorPanel, PublishedPage, Suggestions, Composer, StylePicker
```

To add a template, copy `src/shared/templates/minimal.ts`, change it, and add it to `TEMPLATES` in `src/shared/templates/index.ts`.
