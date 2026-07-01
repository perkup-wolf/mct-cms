# Plan 2: Audit Log Plugin — Tasks 1–4 Implementation Brief

**Working directory:** `C:\Users\Thanapol.c\OneDrive - Marco Technology Co.,Ltd\Workspace\mct-cms`
**Base commit:** `7c678eac`
**All changes go in:** `templates/starter-cloudflare/src/plugins/audit-log/`

## Confirmed API facts (verified from codebase)

- `import { definePlugin } from "emdash"` — creates `ResolvedPlugin` from `PluginDefinition`
- `import type { PluginDefinition, PluginDescriptor } from "emdash"` — the two key types
- Local entrypoint: `new URL("./src/plugins/audit-log/index.ts", import.meta.url).href`
  (confirmed from `templates/marketing-cloudflare/astro.config.mjs:62`)
- Plugin exports: named `createPlugin()` + `export default createPlugin`
  (confirmed from `templates/marketing-cloudflare/src/plugins/marketing-blocks/index.ts`)
- Storage API: `ctx.storage.<collection>.put(id, data)`, `.query(options)`, `.deleteMany(ids)`, `.count(where)`
  (confirmed from `packages/plugins/api-test/src/index.ts`)
- Storage query options: `{ where?: WhereClause, orderBy?: Record<string, "asc"|"desc">, limit?: number, cursor?: string }`
- WhereClause value can be `RangeFilter: { gt?, gte?, lt?, lte? }` for date range queries
- Hook context: NO `ctx.user`, NO `ctx.db` — hooks only have `ctx.storage`, `ctx.kv`, `ctx.log`, `ctx.content`, `ctx.plugin`
- Content hook events: `ContentHookEvent { content: Record<string,unknown>, collection: string, isNew: boolean }`
- Delete hook event: `ContentDeleteEvent { id: string, collection: string, permanent: boolean }`
- Restore hook event: `ContentPublishStateChangeEvent { content: Record<string,unknown>, collection: string }`
- Lifecycle hook event: `LifecycleEvent {}` (empty) — use `ctx.plugin.id` for plugin ID
- Admin export format: `export const pages: PluginAdminExports["pages"] = { "/": ComponentFn }`
  (confirmed from `packages/plugins/forms/src/admin.tsx`)
- Route URL pattern: `/_emdash/api/plugins/{pluginId}/{routeName}`

## Task 1: Scaffold Plugin

### Files to create
- `templates/starter-cloudflare/src/plugins/audit-log/index.ts`
- Modify `templates/starter-cloudflare/astro.config.mjs`

### index.ts

```ts
import { definePlugin } from "emdash";
import type { PluginDefinition } from "emdash";

const definition: PluginDefinition = {
  id: "audit-log",
  version: "1.0.0",

  storage: {
    entries: {
      indexes: ["category", "occurred_at", ["category", "occurred_at"]],
    },
  },

  admin: {
    pages: [{ path: "/", label: "Activity Log", icon: "list" }],
  },

  hooks: {},   // filled in Task 2
  routes: {},  // filled in Task 3
};

export function createPlugin() {
  return definePlugin(definition);
}

export default createPlugin;
```

### astro.config.mjs changes

Add `plugins: [...]` to the `emdash({...})` call:

```js
emdash({
  database: d1({ binding: "DB", session: "auto" }),
  storage: r2({ binding: "MEDIA" }),
  admin: { siteName: "MCT CMS", logo: "/_brand/logo", favicon: "/brand/favicon.svg" },
  plugins: [
    {
      id: "audit-log",
      version: "1.0.0",
      entrypoint: new URL("./src/plugins/audit-log/index.ts", import.meta.url).href,
      adminEntry: new URL("./src/plugins/audit-log/admin.tsx", import.meta.url).href,
      adminPages: [{ path: "/", label: "Activity Log", icon: "list" }],
    },
  ],
}),
```

Note: `admin.tsx` doesn't exist yet — that's Task 3. The plugin will fail to load until Task 3 creates it. That's OK; commit Task 1 now and Tasks 2-4 will complete the plugin.

Actually, to avoid errors before Task 3, create a stub `admin.tsx` in Task 1:

```tsx
// templates/starter-cloudflare/src/plugins/audit-log/admin.tsx
import type { PluginAdminExports } from "emdash";

export const pages: PluginAdminExports["pages"] = {
  "/": () => <div>Audit Log (coming soon)</div>,
};
```

Note: This file uses JSX — the tsconfig extends `astro/tsconfigs/base` which should handle React JSX in `.tsx` files. If there are JSX errors, add `import * as React from "react";` at the top.

### Commit

```
feat(audit-log): scaffold plugin with storage declaration
```

---

## Task 2: Event Hooks

Add hooks to `definition` in `index.ts`.

The entry data shape stored in `ctx.storage.entries`:
```ts
interface AuditEntry {
  category: "content" | "user" | "system";
  action: string;
  occurred_at: string; // ISO string — indexed
  record_type?: string;
  record_id?: string;
  meta?: Record<string, unknown>;
}
```

Use `crypto.randomUUID()` for entry IDs (available in Cloudflare Workers runtime globally).

### Hooks to add to definition.hooks

```ts
hooks: {
  "content:afterSave": {
    handler: async (event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "content",
        action: event.isNew ? "created" : "updated",
        occurred_at: new Date().toISOString(),
        record_type: event.collection,
        record_id: typeof event.content.id === "string" ? event.content.id : undefined,
        meta: typeof event.content.title === "string" ? { title: event.content.title } : undefined,
      });
    },
  },

  "content:afterDelete": {
    handler: async (event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "content",
        action: "deleted",
        occurred_at: new Date().toISOString(),
        record_type: event.collection,
        record_id: event.id,
      });
    },
  },

  "content:afterRestore": {
    handler: async (event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "content",
        action: "restored",
        occurred_at: new Date().toISOString(),
        record_type: event.collection,
        record_id: typeof event.content.id === "string" ? event.content.id : undefined,
      });
    },
  },

  "plugin:install": {
    handler: async (_event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "system",
        action: "plugin:installed",
        occurred_at: new Date().toISOString(),
        meta: { pluginId: ctx.plugin.id },
      });
    },
  },

  "plugin:activate": {
    handler: async (_event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "system",
        action: "plugin:activated",
        occurred_at: new Date().toISOString(),
        meta: { pluginId: ctx.plugin.id },
      });
    },
  },

  "plugin:deactivate": {
    handler: async (_event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "system",
        action: "plugin:deactivated",
        occurred_at: new Date().toISOString(),
        meta: { pluginId: ctx.plugin.id },
      });
    },
  },

  "plugin:uninstall": {
    handler: async (_event, ctx) => {
      const id = crypto.randomUUID();
      await ctx.storage.entries.put(id, {
        category: "system",
        action: "plugin:uninstalled",
        occurred_at: new Date().toISOString(),
        meta: { pluginId: ctx.plugin.id },
      });
    },
  },
},
```

TypeScript note: `ctx.storage.entries` — the `storage` type on `PluginContext` is `PluginStorage<TStorage>`. Since `definePlugin` returns a `ResolvedPlugin` with a generic storage type, `ctx.storage.entries` may be typed as `StorageCollection<unknown>`. This is fine — the `.put(id, data)` call will work with `any` data object.

If TypeScript complains about `ctx.storage.entries` not existing, check if `definePlugin` needs generic type params. Workaround: cast `(ctx.storage as any).entries`.

### Commit

```
feat(audit-log): content and system event hooks
```

---

## Task 3: Admin Page + Query Route

### Files to create/modify
- Replace stub `templates/starter-cloudflare/src/plugins/audit-log/admin.tsx` with full implementation
- Add `routes` to `definition` in `index.ts`

### Route added to definition.routes

```ts
routes: {
  "entries": {
    public: false,
    handler: async (ctx) => {
      const input = ctx.input as {
        category?: string;
        from?: string;
        to?: string;
        cursor?: string;
        limit?: number;
      };

      const where: Record<string, unknown> = {};
      if (input.category) where.category = input.category;
      if (input.from || input.to) {
        where.occurred_at = {
          ...(input.from ? { gte: input.from } : {}),
          ...(input.to ? { lte: input.to } : {}),
        };
      }

      return (ctx.storage as any).entries.query({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { occurred_at: "desc" },
        limit: Math.min(input.limit ?? 50, 100),
        cursor: input.cursor,
      });
    },
  },
},
```

The route is called from the admin page at:
`/_emdash/api/plugins/audit-log/entries`

With POST body `{ category, from, to, cursor, limit }` OR as GET with query params — check how plugin routes work by looking at `packages/core/src/astro/routes/api/plugins/[pluginId]/[...path].ts` if needed.

### admin.tsx — full implementation

```tsx
import * as React from "react";
import type { PluginAdminExports } from "emdash";

interface AuditEntry {
  id: string;
  data: {
    category: "content" | "user" | "system";
    action: string;
    occurred_at: string;
    record_type?: string;
    record_id?: string;
    meta?: Record<string, unknown>;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  content: "#1a56db",
  user: "#7c3aed",
  system: "#d97706",
};

function AuditLogPage() {
  const [items, setItems] = React.useState<AuditEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [cursor, setCursor] = React.useState<string | undefined>();
  const [hasMore, setHasMore] = React.useState(false);
  const [category, setCategory] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function load(resetCursor = true) {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { limit: 50 };
      if (category) body.category = category;
      if (from) body.from = from;
      if (to) body.to = to;
      if (!resetCursor && cursor) body.cursor = cursor;

      const res = await fetch("/_emdash/api/plugins/audit-log/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { items: AuditEntry[]; hasMore: boolean; cursor?: string };

      if (resetCursor) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
      setCursor(data.cursor);
      setTotal(prev => resetCursor ? data.items.length : prev + data.items.length);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void load(true); }, [category, from, to]);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Activity Log</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
        >
          <option value="">All categories</option>
          <option value="content">Content</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="To"
        />
        <button
          onClick={() => { setCategory(""); setFrom(""); setTo(""); }}
          style={{ padding: "0.375rem 0.75rem", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}
        >
          Clear
        </button>
      </div>

      {loading && items.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No events found.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Time</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Action</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Record</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {new Date(item.data.occurred_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span style={{
                      background: (CATEGORY_COLORS[item.data.category] ?? "#6b7280") + "20",
                      color: CATEGORY_COLORS[item.data.category] ?? "#6b7280",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      {item.data.category}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{item.data.action}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280" }}>
                    {item.data.record_type
                      ? `${item.data.record_type}${item.data.record_id ? ` #${item.data.record_id}` : ""}`
                      : item.data.meta ? JSON.stringify(item.data.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => void load(false)}
                disabled={loading}
                style={{ padding: "0.5rem 1rem", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const pages: PluginAdminExports["pages"] = {
  "/": AuditLogPage,
};
```

### Commit

```
feat(audit-log): React admin page with filters and plugin query route
```

---

## Task 4: 90-Day Retention Cron

Add a `cron` hook to `definition.hooks` in `index.ts`:

```ts
"cron": {
  handler: async (_event, ctx) => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let purged = 0;
    let cursor: string | undefined;

    do {
      const result = await (ctx.storage as any).entries.query({
        where: { occurred_at: { lt: cutoff } },
        orderBy: { occurred_at: "asc" },
        limit: 100,
        cursor,
      }) as { items: Array<{ id: string }>; hasMore: boolean; cursor?: string };

      if (result.items.length > 0) {
        const ids = result.items.map((item) => item.id);
        const deleted = await (ctx.storage as any).entries.deleteMany(ids);
        purged += typeof deleted === "number" ? deleted : ids.length;
      }

      cursor = result.cursor;
    } while (cursor && cursor !== "");

    ctx.log.info(`Audit log purge: removed ${purged} entries older than 90 days`);
  },
},
```

### Commit

```
feat(audit-log): 90-day retention cron purge
```

---

## Implementation notes

1. **TypeScript path for `ctx.storage.entries`**: Since `definePlugin` uses a generic, the storage type might not be inferred correctly. Use `(ctx.storage as any).entries` if TypeScript can't resolve the collection name.

2. **JSX in admin.tsx**: The file uses React JSX. `tsconfig.json` extends `astro/tsconfigs/base` — check if `jsx` is set to `react-jsx`. Add `import * as React from "react"` to be safe.

3. **`PluginAdminExports` import**: `import type { PluginAdminExports } from "emdash"` — verify this exports the type, otherwise import from `"emdash/plugins"`.

4. **Plugin route method**: Plugin routes are accessed via POST by default (based on `RouteContext.request`). The admin page should use `fetch(..., { method: "POST", body: JSON.stringify({...}) })`.

5. **Do NOT create** `src/pages/api/audit-log.ts` — the plan suggested this but plugin routes (via `routes: {}` in PluginDefinition) are the correct approach and are already handled by EmDash.

## After all 4 tasks

Write a report to `.superpowers/sdd/plan-2-report.md` with:
- Commit hashes for each task
- Any TypeScript errors encountered and how resolved
- Confirmation that `ctx.storage.entries` was accessible (or what cast was needed)
