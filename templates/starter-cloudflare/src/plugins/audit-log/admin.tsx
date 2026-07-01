import * as React from "react";
import type { PluginAdminExports } from "emdash";

export const pages: PluginAdminExports["pages"] = {
  "/": () => <div>Audit Log (coming soon)</div>,
};
