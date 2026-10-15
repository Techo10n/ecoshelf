# EcoShelf — Claude Code Instructions

## Getting up to speed

Read `../vault/projects/ecoshelf/index.md` first — it routes to the architecture page and the
gotchas.

Dormant since 2025-07-01, so treat this as a revival rather than ongoing work.

## Before working here

Read `../vault/projects/ecoshelf/gotchas.md`. Things to know up front:

- **The search term needs the backend running on `localhost:8000`** with OpenAI credit. Without it
  the popup still shows the product, with "Search term unavailable".
- **What exists:** the scraper (`frontend/src/utils/scrape.ts`, run on popup open), the popup, and
  the title-trimming endpoint. The alternative-vendor search and the emissions calculation are not
  built.
- **`cd frontend && npm test`** runs the scraper against saved Amazon pages and the popup end to end.

`backend/` exists solely to hold `OPENAI_API_KEY` — a browser extension bundle is fully readable, so
the key can't ship in it. Keep application logic in the extension.

## Keeping the vault current

Claude Code is the vault's only writer. Before writing to it, read `../vault/CLAUDE.md`.

**Standing rule:** when you fix a bug, make a design decision, or discover a wrong assumption, record
it in `../vault/projects/ecoshelf/gotchas.md` before the work is done, then append to
`../vault/log.md`. `/kb-update` does both.

If you establish what is and isn't implemented, that resolves an open `> TODO:` in the vault —
update it.

## Running it

```bash
cd backend && npm install && npm run dev     # localhost:8000, needs .env with OPENAI_API_KEY
cd frontend && npm install && npm run dev    # WXT dev server
```
