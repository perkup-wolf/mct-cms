# SDD Progress Ledger — Plan 2: Audit Log Plugin

## Status
- Task 1: pending (scaffold plugin + storage declaration + register in astro.config.mjs)
- Task 2: pending (content + system event hooks)
- Task 3: pending (React admin page + plugin route)
- Task 4: pending (90-day retention cron)

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
