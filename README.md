# MCT CMS workspace (built on EmDash)

This repository is Marco Technology Co.,Ltd's working copy of [EmDash](https://github.com/emdash-cms/emdash) -- a full-stack TypeScript CMS built on [Astro](https://astro.build/) and [Cloudflare](https://www.cloudflare.com/). It has been trimmed to exactly what's needed to build and develop one site, [`sites/mct-site`](sites/mct-site) (white-labeled as "MCT CMS" in its admin panel) -- it is **not** the general-purpose upstream EmDash project. The upstream templates, demo sites, and documentation site have been removed; see [emdash-cms/emdash](https://github.com/emdash-cms/emdash) for the full OSS product, template gallery, and docs.

The EmDash packages this site depends on ([`packages/core`](packages/core), `admin`, `cloudflare`, `auth`, `auth-atproto`, `blocks`, `gutenberg-to-portable-text`, `plugin-types`, `registry-client`, `registry-lexicons`) are kept in this workspace as `workspace:*` links rather than published npm versions, so fixes made to the CMS itself apply to the site immediately, without a release cycle.

**To develop the site, see [`sites/mct-site/README.md`](sites/mct-site/README.md).** The rest of this document explains the CMS underneath it.

EmDash takes the ideas that made WordPress dominant -- extensibility, admin UX, a plugin ecosystem -- and rebuilds them on serverless, type-safe foundations. Plugins run in sandboxed Worker isolates, solving the fundamental security problem with WordPress's plugin architecture. It runs on Cloudflare (D1 + R2 + Workers) or any Node.js server with SQLite -- no PHP, no separate hosting tier.

> [!IMPORTANT]
> EmDash depends on Dynamic Workers to run secure sandboxed plugins. Dynamic Workers are currently only available on paid Cloudflare accounts. [Upgrade your account](https://www.cloudflare.com/plans/developer-platform/) (starting at $5/mo) or comment out the `worker_loaders` block of `sites/mct-site/wrangler.jsonc` to disable plugins.

## Why EmDash?

**WordPress was built for a different era.** Running WordPress today means managing PHP alongside JavaScript, layering caches to get acceptable performance, and knowing that [96% of WordPress security vulnerabilities come from plugins](https://patchstack.com/whitepaper/state-of-wordpress-security-in-2024/). EmDash is what WordPress would look like if you started from scratch with today's tools.

**Sandboxed plugins.** WordPress plugins have full access to the database, filesystem, and user data. A single vulnerable plugin can compromise the entire site. EmDash plugins run in isolated [Worker sandboxes](https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/) via Dynamic Worker Loaders, each with a declared capability manifest. A plugin that requests `read:content` and `email:send` can do exactly that and nothing else.

```typescript
export default () =>
	definePlugin({
		id: "notify-on-publish",
		capabilities: ["read:content", "email:send"],
		hooks: {
			"content:afterSave": async (event, ctx) => {
				if (event.content.status !== "published") return;
				await ctx.email.send({
					to: "editors@example.com",
					subject: `New post: ${event.content.title}`,
				});
			},
		},
	});
```

**Structured content, not serialized HTML.** WordPress stores rich text as HTML with metadata embedded in comments -- tying your content to its DOM representation. EmDash uses [Portable Text](https://www.portabletext.org/), a structured JSON format that decouples content from presentation. Your content can render as a web page, a mobile app, an email, or an API response without parsing HTML.

**Built for agents.** EmDash ships with agent skills for building plugins and themes, a CLI that lets agents manage content and schema programmatically, and a built-in [MCP server](https://modelcontextprotocol.io/) so AI tools like Claude and ChatGPT can interact with your site directly.

**Runs anywhere.** EmDash uses portable abstractions at every layer -- Kysely for SQL, S3 API for storage -- that work with SQLite, D1, Turso, PostgreSQL, R2, AWS S3, or local files. It runs best on Cloudflare, but it's not locked to it.

## How It Works

EmDash is an Astro integration. Add it to your config and you get a complete CMS: admin panel, REST API, authentication, media library, and plugin system.

```typescript
// astro.config.mjs
import emdash from "emdash/astro";
import { d1 } from "emdash/db";

export default defineConfig({
	integrations: [emdash({ database: d1() })],
});
```

Content types are defined in the database, not in code. Non-developers create and modify collections through the admin UI. Each collection gets a real SQL table with typed columns. Developers generate TypeScript types from the live schema:

```bash
npx emdash types
```

Query content using Astro's Live Collections -- no rebuilds, no separate API:

```astro
---
import { getEmDashCollection } from "emdash";
const { entries: posts } = await getEmDashCollection("posts");
---

{posts.map((post) => <article>{post.data.title}</article>)}
```

## Features

**Content** -- Blog posts, pages, custom content types. Rich text editing via TipTap with Portable Text storage. Revisions, drafts, scheduled publishing, full-text search (FTS5), inline visual editing.

**Admin** -- Full admin panel with visual schema builder, media library (drag-drop uploads via signed URLs), navigation menus, taxonomies, widgets, and a WordPress import wizard.

**Auth** -- Passkey-first (WebAuthn) with OAuth and magic link fallbacks. Role-based access control: Administrator, Editor, Author, Contributor.

**Plugins** -- `definePlugin()` API with lifecycle hooks, KV storage, settings, admin pages, dashboard widgets, custom block types, and API routes. Sandboxed execution on Cloudflare via Dynamic Worker Loaders.

**Agents** -- Skill files for AI-assisted plugin and theme development. CLI for programmatic site management. Built-in MCP server for direct AI tool integration.

**WordPress migration** -- Import posts, pages, media, and taxonomies from WXR exports, the WordPress REST API, or WordPress.com. Agent skills help port plugins and themes.

## Portable Platforms

| Layer    | Cloudflare                  | Also works with                                     |
| -------- | --------------------------- | --------------------------------------------------- |
| Database | D1                          | SQLite, Turso/libSQL, PostgreSQL                    |
| Storage  | R2                          | AWS S3, any S3-compatible service, local filesystem |
| Sessions | KV                          | Redis, file-based                                   |
| Plugins  | Worker isolates (sandboxed) | In-process (safe mode)                              |

## Status

EmDash upstream is in **beta preview**. Track the project, file issues, or pull in upstream fixes at [emdash-cms/emdash](https://github.com/emdash-cms/emdash); see the [documentation](https://docs.emdashcms.com/) for guides, API reference, and plugin development (also available as an MCP server -- see `sites/mct-site/AGENTS.md`).

## Development

This is a pnpm monorepo, trimmed to `sites/mct-site` and its dependency closure:

```bash
pnpm install
pnpm build           # build the vendored EmDash packages
```

Then work on the site itself -- see [`sites/mct-site/README.md`](sites/mct-site/README.md) for `npx emdash dev`, schema, and deployment.

```bash
pnpm test          # run all tests
pnpm typecheck     # type check
pnpm lint:quick    # fast lint (< 1s)
pnpm format        # format with oxfmt
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions when changing the vendored packages (backwards compatibility, changesets, TDD for bugs).

## Repository structure

```
packages/
  core/                       Astro integration, APIs, admin UI runtime, CLI
  admin/                      Admin panel React app (Sidebar, Settings, media library, etc.)
  auth/                       Authentication library
  auth-atproto/               AT Protocol auth (optional peer dependency of core)
  blocks/                     Portable Text block definitions
  cloudflare/                 Cloudflare adapter (D1, R2, Worker Loader)
  gutenberg-to-portable-text/ WordPress block converter
  plugin-types/               Shared plugin type definitions
  registry-client/            Plugin registry client
  registry-lexicons/          Plugin registry schema lexicons

sites/
  mct-site/                   The actual site -- see its own README.md
```

This repo intentionally does **not** contain the upstream project's `templates/`, `demos/`, `docs/`, or `packages/create-emdash` -- they were removed to keep this workspace scoped to `sites/mct-site`. Reach for the upstream repo if you need those.
