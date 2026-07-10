# MCT CMS (`mct-site`)

This is a real, deployable EmDash CMS + website project, not a template or example. It was scaffolded as a copy of `templates/starter-cloudflare`, so its structure and tooling match the starter, but it evolves independently as the actual MCT site. Its dependencies stay on `workspace:*` links to this repo's in-development EmDash packages rather than the published npm versions, so fixes and changes made elsewhere in this repo apply here immediately without a release cycle. It is unrelated to `control-panel/`, which is a separate, multi-tenant control-panel effort for managing many client sites — `sites/mct-site` is a single, specific site.

For the full rationale behind this project's existence and structure, see the spec and plan:

- [`docs/superpowers/specs/2026-07-09-mct-site-single-project-design.md`](../../docs/superpowers/specs/2026-07-09-mct-site-single-project-design.md)
- [`docs/superpowers/plans/2026-07-09-mct-site-single-project.md`](../../docs/superpowers/plans/2026-07-09-mct-site-single-project.md)

For day-to-day usage (commands, schema, key files, agent skills), see [`AGENTS.md`](./AGENTS.md).

## Stack

- **Astro** (`output: "server"`) — every content page is server-rendered; no static builds of CMS content.
- **EmDash** (`emdash/astro`) — CMS integration: admin panel, REST API, auth, media library, plugin system.
- **Cloudflare** — deploys as a single Worker (`@astrojs/cloudflare`), backed by:
  - **D1** (binding `DB`) — content, schema, users
  - **R2** (binding `MEDIA`) — uploaded media and the site logo
  - **KV** (binding `SESSION`) — login sessions
  - A per-minute **Cron Trigger** — scheduled publishing and plugin maintenance jobs
- **React** (`@astrojs/react`) + **Tailwind CSS v4** (`@tailwindcss/vite`) for admin extensions and site styling.
- **i18n** — English (`en`) and Thai (`th`) via Astro's built-in locale routing.

See [`wrangler.jsonc`](./wrangler.jsonc) for the live binding configuration and [`astro.config.mjs`](./astro.config.mjs) for the EmDash integration setup.

## Getting started

```bash
npx emdash dev        # Start dev server (runs migrations, seeds, generates types)
npx emdash types      # Regenerate TypeScript types from schema
```

The public site runs at `http://localhost:4321/`, the admin panel at `http://localhost:4321/_emdash/admin`.

## What's customized here

Beyond the starter template, this project has its own:

- **White-labeled admin** — branded "MCT CMS" (not "EmDash") in the sidebar, browser tab, and login screen. See [`astro.config.mjs`](./astro.config.mjs)'s `admin` option and [`../../BRANDING_MAP.md`](../../BRANDING_MAP.md) for the full white-label inventory.
- **Site logo upload** — a small admin-only page at `/_brand/settings` ([`src/pages/_brand/settings.astro`](./src/pages/_brand/settings.astro), backed by [`src/brand/LogoSettings.tsx`](./src/brand/LogoSettings.tsx)) lets an admin upload a logo image, stored in R2 and served from `/_brand/logo` ([`src/pages/_brand/logo.ts`](./src/pages/_brand/logo.ts)), falling back to `public/brand/logo-default.svg` when nothing's been uploaded yet.
- **Audit log plugin** — [`src/plugins/audit-log/`](./src/plugins/audit-log/) is a first-party EmDash plugin (not part of the starter) that records content changes and plugin lifecycle events, viewable from its own "Activity Log" admin page. It's a working example of EmDash's capability-scoped plugin model — see the plugin's `capabilities: ["content:read"]` declaration in `index.ts`.
- **Custom typefaces and theme** — Fraunces (display) and Inter (body) configured in `astro.config.mjs`, plus [`src/styles/theme.css`](./src/styles/theme.css) and [`src/styles/tailwind.css`](./src/styles/tailwind.css) (the starter ships with neither by default).

## Pages

| Page        | Path                | What it shows                                  |
| ----------- | ------------------- | ----------------------------------------------- |
| Home        | `/`                 | Site title + tagline, links into Posts / About |
| All posts   | `/posts`            | Post list                                      |
| Post detail | `/posts/[slug]`     | Post content                                   |
| Page        | `/[slug]`           | Static page content (e.g. `/about`)            |
| Category    | `/category/[slug]` | Posts filtered by category                     |
| Tag         | `/tag/[slug]`       | Posts filtered by tag                          |

## Schema

- `posts` collection — `title`, `featured_image`, `content` (Portable Text), `excerpt`.
- `pages` collection — `title`, `content` (Portable Text).
- `site_appearance` collection — site-level appearance settings.
- Taxonomies: `category`, `tag`.
- Single `primary` menu.

## Deploying

```bash
npm run deploy    # astro build && wrangler deploy
```

Deploys to the Cloudflare Worker named `mct-site` (see `wrangler.jsonc`), using the D1 database, R2 bucket, and KV namespace already bound there.
