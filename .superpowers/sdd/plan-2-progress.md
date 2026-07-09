# SDD Progress Ledger — Plan 2: Audit Log Plugin

## Status
- Task 1: COMPLETE (commit 279f9f23 — scaffold + storage + astro.config.mjs registration)
- Task 2: COMPLETE (commit 8549a2a9 — 7 hooks: content:afterSave/Delete/Restore, plugin:install/activate/deactivate/uninstall)
- Task 3: COMPLETE (commit 27cb0eb2 — admin page with category/date filters + entries route)
- Task 4: COMPLETE (commit 795285f0 — 90-day cron purge via batched query+deleteMany)

## Key Architecture Decisions (from codebase research)
- Plugin lives at `templates/starter-cloudflare/src/plugins/audit-log/`
- NO D1 migrations — storage is declared via `storage: { entries: { indexes: [...] } }` in PluginDefinition and EmDash manages the table
- `ctx.db` does NOT exist — use `ctx.storage.entries` (plugin-scoped KV with query/put/delete)
- `PluginContext` has NO user info — entries store category/action/record info only (no user fields)
- Hook events: ContentHookEvent has `.content` (record data), `.collection`, `.isNew`; ContentDeleteEvent has `.id`, `.collection`
- Lifecycle hooks (plugin:install etc.) receive empty LifecycleEvent — use `ctx.plugin.id` not `ctx.pluginId`
- Entrypoint pattern: `new URL("./src/plugins/audit-log/index.ts", import.meta.url).href` (confirmed from templates/marketing-cloudflare)
- Admin page: export `export const pages: PluginAdminExports["pages"] = { "/": AuditLogPage }` from admin.tsx
- Plugin route URL: `/_emdash/api/plugins/audit-log/entries`
- Cron purge: query+deleteMany in batches (no raw SQL DELETE WHERE)
