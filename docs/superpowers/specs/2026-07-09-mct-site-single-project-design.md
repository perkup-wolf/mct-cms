# mct-site: single embedded emdash project

## Context

Recent work in this repo (`control-panel/`) targets a multi-tenant "super admin"
setup that provisions and manages many client sites. That is a separate,
independent effort and is untouched by this spec.

This spec covers a different, immediate need: stand up **one real site** for
one client, with emdash CMS and the public website running together, the way
emdash is designed to run everywhere else in this repo (every `templates/*`
project embeds the CMS and the site in a single Astro app/single deployment).

We considered and rejected splitting this into a headless CMS project + a
separate website project (the "headless WordPress" pattern). That pattern is
only worth its added complexity (cross-Worker API auth via tokens, network
hop on every content fetch, hand-parsed API responses instead of in-process
typed content access) when multiple frontends need to share one CMS, or the
website's deploy cadence must be decoupled from the CMS's. Neither applies
here — one CMS, one website, one team. The classic single-project ("like
WordPress") model is simpler and is what emdash is built for.

## Goal

Turn `templates/starter-cloudflare` into a real, deployable project for this
client: `sites/mct-site`. Configure and deploy it as-is — no new content
types, no custom design/theme. That work is separate follow-up scope.

## Decisions

- **Location:** new top-level `sites/mct-site/` folder in this monorepo (not
  a separate repo, not editing `templates/starter-cloudflare` in place —
  `templates/*` stays generic/reference).
- **emdash source:** `workspace:*` links to the in-development `emdash`
  (`packages/core`), `@emdash-cms/admin`, `@emdash-cms/cloudflare`, etc. — not
  the published npm package via `create-emdash`. This site should immediately
  reflect fixes made to emdash core during this same development effort (e.g.
  the lingui-macro dev-mode hydration fix already landed in
  `packages/core/src/astro/integration/vite-config.ts`).
- **Content model:** unchanged from `starter-cloudflare` — `posts`, `pages`
  collections; `category`, `tag` taxonomies; single `primary` menu. No new
  fields or collections.
- **Rendering:** single Astro project, `output: "server"`, admin at
  `/_emdash/admin`, public pages server-rendered from the same deployment.
  No separate website project, no content REST API consumption from a
  second app.
- **Cloudflare resources:** new D1 database and R2 bucket provisioned for
  this site specifically (not shared with `control-panel` or other sites).

## Implementation Steps

1. Copy `templates/starter-cloudflare/` → `sites/mct-site/` verbatim.
2. Add `sites/*` to the `packages:` glob in `pnpm-workspace.yaml`.
3. Rename identifiers for the new project:
   - `sites/mct-site/package.json`: `name` → `mct-site`
   - `sites/mct-site/wrangler.jsonc`: `name` → `mct-site`; D1
     `database_name` → `mct-site`; R2 `bucket_name` → `mct-site-media`
4. Keep all `workspace:*` dependency ranges as copied — do not repoint to
   published versions.
5. Provision Cloudflare resources:
   - `wrangler d1 create mct-site` → paste resulting `database_id` into
     `wrangler.jsonc` (placeholder `REPLACE_AFTER_CREATION` until then,
     matching the convention already used in `control-panel/wrangler.toml`)
   - `wrangler r2 bucket create mct-site-media`
6. `pnpm install` at the repo root to link the new workspace member.
7. Verify locally: `pnpm --filter mct-site dev`, confirm admin UI loads at
   `/_emdash/admin` and public pages render, no hydration errors (watch for
   regressions of the lingui-macro dev bug fixed earlier this session).
8. Deploy: `wrangler deploy` from `sites/mct-site`.

## Explicitly out of scope

- control-panel multi-tenant integration
- Headless CMS/website split
- New content types/fields
- Custom design, theme, or layout work beyond the starter template's defaults
