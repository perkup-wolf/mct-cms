#!/usr/bin/env bash
# Run the Astro dev server directly (bypasses pnpm verifyDepsBeforeRun)
cd "$(dirname "$0")"
node node_modules/astro/bin/astro.mjs dev --port 4322
