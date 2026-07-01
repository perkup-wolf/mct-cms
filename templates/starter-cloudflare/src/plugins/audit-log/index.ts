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
