# mct-site Single Embedded Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `sites/mct-site` as a real, deployable emdash project — a copy of `templates/starter-cloudflare`, workspace-linked to the in-development emdash packages, configured with its own Cloudflare D1 database and R2 bucket, verified locally and deployed.

**Architecture:** Single Astro project, single Cloudflare Worker. CMS admin (`/_emdash/admin`) and the public website (posts/pages/categories/tags) run in the same deployment — no headless split, no second project. `emdash`, `@emdash-cms/admin`, `@emdash-cms/cloudflare` stay on `workspace:*` so in-repo fixes apply immediately.

**Tech Stack:** Astro 7 (`output: "server"`), `@astrojs/cloudflare` adapter, Cloudflare D1 + R2 + Workers, pnpm workspaces, Wrangler.

## Global Constraints

- Location: new top-level `sites/mct-site/` folder (not editing `templates/starter-cloudflare` in place, not a separate repo).
- emdash deps stay `workspace:*` — never repoint to published npm versions.
- Content model unchanged from `starter-cloudflare`: `posts`, `pages` collections; `category`, `tag` taxonomies; single `primary` menu. No new fields/collections.
- No control-panel integration, no headless CMS/website split, no custom design/theme work.
- New Cloudflare D1 database and R2 bucket dedicated to this site (not shared with `control-panel` or other sites).

---

### Task 1: Scaffold `sites/mct-site` from the starter template

**Files:**
- Create: `sites/mct-site/**` (copy of every git-tracked file under `templates/starter-cloudflare/`)
- Modify: `pnpm-workspace.yaml` (add `sites/*` to the `packages:` glob)
- Modify: `sites/mct-site/package.json` (rename)
- Modify: `sites/mct-site/wrangler.jsonc` (rename)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a `sites/mct-site` directory recognized as a pnpm workspace member named `mct-site`, ready for `pnpm install`

- [ ] **Step 1: Copy the template's tracked files into the new location**

Run from the repo root:

```bash
git ls-files templates/starter-cloudflare | while IFS= read -r f; do
  dest="sites/mct-site/${f#templates/starter-cloudflare/}"
  mkdir -p "$(dirname "$dest")"
  cp "$f" "$dest"
done
```

Expected: `sites/mct-site/` now contains 48 files matching `git ls-files templates/starter-cloudflare | wc -l`. Verify with:

```bash
find sites/mct-site -type f | wc -l
```

Expected: `48`

- [ ] **Step 2: Add `sites/*` to the pnpm workspace glob**

In `pnpm-workspace.yaml`, find the `packages:` list:

```yaml
packages:
  - packages/*
  - packages/plugins/*
  - apps/*
  - demos/*
  - templates/*
  - packages/blocks/playground
  - e2e/fixture
  - e2e/fixture-cloudflare
  - fixtures/*
  - docs
  - i18n
  - infra/*
```

Add `- sites/*` after `- templates/*`:

```yaml
packages:
  - packages/*
  - packages/plugins/*
  - apps/*
  - demos/*
  - templates/*
  - sites/*
  - packages/blocks/playground
  - e2e/fixture
  - e2e/fixture-cloudflare
  - fixtures/*
  - docs
  - i18n
  - infra/*
```

- [ ] **Step 3: Rename the project in `sites/mct-site/package.json`**

Change line 2 from:

```json
  "name": "@emdash-cms/template-starter-cloudflare",
```

to:

```json
  "name": "mct-site",
```

Leave every other field (scripts, dependencies, devDependencies) untouched — all `workspace:*` and `catalog:` ranges stay as copied.

- [ ] **Step 4: Rename the project in `sites/mct-site/wrangler.jsonc`**

Change:

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "my-emdash-site",
	"main": "./src/worker.ts",
	"compatibility_date": "2026-02-24",
	"compatibility_flags": ["nodejs_compat"],
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "my-emdash-site",
		},
	],
	"r2_buckets": [
		{
			"binding": "MEDIA",
			"bucket_name": "my-emdash-media",
		},
	],
```

to:

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "mct-site",
	"main": "./src/worker.ts",
	"compatibility_date": "2026-02-24",
	"compatibility_flags": ["nodejs_compat"],
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "mct-site",
			"database_id": "REPLACE_AFTER_CREATION",
		},
	],
	"r2_buckets": [
		{
			"binding": "MEDIA",
			"bucket_name": "mct-site-media",
		},
	],
```

(Everything below `r2_buckets` — `worker_loaders`, `triggers` — is unchanged.)

- [ ] **Step 5: Install to link the new workspace member**

Run from the repo root:

```bash
pnpm install
```

Expected: exits 0, and `pnpm ls --filter mct-site --depth -1` prints the `mct-site` package with its workspace-linked deps (`emdash`, `@emdash-cms/cloudflare`).

- [ ] **Step 6: Commit**

```bash
git add sites/mct-site pnpm-workspace.yaml
git commit -m "$(cat <<'EOF'
feat(mct-site): scaffold single-project emdash site from starter template

Copies templates/starter-cloudflare into sites/mct-site as a real,
deployable project, keeping workspace:* links to the in-development
emdash packages rather than the published npm release.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Verify local dev server (admin + site, no hydration errors)

**Files:**
- None created/modified — verification only.

**Interfaces:**
- Consumes: `sites/mct-site` from Task 1, already `pnpm install`-ed
- Produces: confirmation the site is safe to provision Cloudflare resources for

- [ ] **Step 1: Start the dev server**

```bash
cd sites/mct-site
ASTRO_DEV_BACKGROUND=1 pnpm dev
```

(`ASTRO_DEV_BACKGROUND=1` avoids Astro 7's auto-detected background-daemon mode, which fails to spawn under an agent-driven shell — see the note already in this repo's session history.)

Expected: log ends with

```
astro  vX.X.X ready in ... ms
┃ Local    http://localhost:4321/
watching for file changes...
```

and prints the `Admin UI`/`MCP server` URLs, with no `[ERROR]` lines.

- [ ] **Step 2: Confirm the admin route loads without a hydration error**

```bash
curl -s "http://localhost:4321/_emdash/admin/login" -o /dev/null -w "HTTP %{http_code}\n"
```

Expected: `HTTP 200`

Then check the dev server's own log output for the failure mode already seen once in this repo (`packages/core/src/astro/integration/vite-config.ts`'s lingui-macro transform):

```bash
grep -i "error hydrating\|SyntaxError\|does not provide an export\|Unable to determine current node version" <dev-server-log-path>
```

Expected: no matches. If any appear, the fix from that earlier session (the `linguiMacroPlugin` path-normalization + `pathToFileURL` fix in `vite-config.ts`) has regressed — stop and re-diagnose before continuing; do not re-guess a new fix here.

- [ ] **Step 3: Confirm the public site renders**

```bash
curl -s "http://localhost:4321/" -o /dev/null -w "HTTP %{http_code}\n"
curl -s "http://localhost:4321/posts" -o /dev/null -w "HTTP %{http_code}\n"
```

Expected: both `HTTP 200`.

- [ ] **Step 4: Stop the dev server**

Stop the background dev server process before moving on (find its PID via `netstat -ano | grep ":4321"` on Windows, then `Stop-Process -Id <pid> -Force` via PowerShell, or send SIGTERM if it was foregrounded).

No commit for this task — verification only, nothing changed.

---

### Task 3: Provision Cloudflare D1 + R2 resources

**Files:**
- Modify: `sites/mct-site/wrangler.jsonc:11` (`database_id`)

**Interfaces:**
- Consumes: `mct-site` / `mct-site-media` names from Task 1
- Produces: real Cloudflare resource IDs wired into `wrangler.jsonc`, ready for `wrangler deploy`

- [ ] **Step 1: Create the D1 database**

```bash
cd sites/mct-site
wrangler d1 create mct-site
```

Expected output includes a block like:

```jsonc
[[d1_databases]]
binding = "DB"
database_name = "mct-site"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

- [ ] **Step 2: Paste the real `database_id` into `wrangler.jsonc`**

Replace `"REPLACE_AFTER_CREATION"` on the `database_id` line with the UUID printed in Step 1.

- [ ] **Step 3: Create the R2 bucket**

```bash
wrangler r2 bucket create mct-site-media
```

Expected: `Created bucket 'mct-site-media'` (R2 buckets don't need an ID wired into config — `bucket_name` is enough, already set in Task 1).

- [ ] **Step 4: Commit**

```bash
git add sites/mct-site/wrangler.jsonc
git commit -m "$(cat <<'EOF'
chore(mct-site): wire up provisioned D1 database id

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Deploy to Cloudflare

**Files:**
- None created/modified — deploy only.

**Interfaces:**
- Consumes: `sites/mct-site/wrangler.jsonc` from Task 3, with real `database_id` and `bucket_name`
- Produces: a live Cloudflare Worker serving both `/_emdash/admin` and the public site

- [ ] **Step 1: Run the production build**

```bash
cd sites/mct-site
pnpm build
```

Expected: exits 0, `dist/` created.

- [ ] **Step 2: Deploy**

```bash
wrangler deploy
```

Expected: output ends with a `https://mct-site.<your-subdomain>.workers.dev` URL (or your configured custom domain/route, if one is added to `wrangler.jsonc` separately — not part of this plan's scope) and no errors.

- [ ] **Step 3: Smoke-test the deployed site**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" "https://<deployed-url>/"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "https://<deployed-url>/_emdash/admin/login"
```

Expected: both `HTTP 200`.

- [ ] **Step 4: Confirm first-run setup**

Visit `https://<deployed-url>/_emdash/admin` in a browser and complete the first-admin setup flow (emdash's setup wizard, since this is the first deploy against a fresh D1 database). No code change here — this is a one-time manual step, not part of the plan's file changes.

No commit for this task — deployment only, no repo changes beyond Task 3.
