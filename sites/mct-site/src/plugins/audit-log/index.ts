import { definePlugin } from "emdash";
import type { PluginDefinition } from "emdash";

const definition: PluginDefinition = {
  id: "audit-log",
  version: "1.0.0",

  capabilities: ["content:read"],

  storage: {
    entries: {
      indexes: ["category", "occurred_at", ["category", "occurred_at"]],
    },
  },

  admin: {
    pages: [{ path: "/", label: "Activity Log", icon: "list" }],
  },

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
  },
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
};

export function createPlugin() {
  return definePlugin(definition);
}

export default createPlugin;
