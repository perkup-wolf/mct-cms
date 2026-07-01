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
  routes: {},  // filled in Task 3
};

export function createPlugin() {
  return definePlugin(definition);
}

export default createPlugin;
