# Task 5 Brief: Per-Client Logo Upload via R2

**Base commit:** `4f2172bb`

## Goal
Allow each client instance to replace the default MCT CMS logo with their own logo file.
Stored in R2 under key `brand/logo` (no extension — content-type in metadata).
Served from a dynamic API endpoint that falls back to the static default SVG.

## Architecture decision (confirmed from codebase research)

- R2 binding `MEDIA` is already declared in `templates/starter-cloudflare/wrangler.jsonc` and wired via `r2({ binding: "MEDIA" })` in `astro.config.mjs`. No wrangler changes needed.
- Cloudflare env is accessed via `locals.runtime.env` in Astro API routes (confirmed pattern from `packages/cloudflare/src/plugins/vectorize-search.ts:90`).
- `Cloudflare.Env` type is declared in `templates/starter-cloudflare/worker-configuration.d.ts` with `MEDIA: R2Bucket`.
- Authorization uses `requirePerm(user, "settings:manage")` imported from `#api/authorize.js` (confirmed from `packages/core/src/astro/routes/api/settings/email.ts:39`).
- `user` comes from `locals.user`.
- Do NOT use the EmDash native plugin system for admin UI — it requires complex `entrypoint` module resolution. Instead, create a standalone Astro page protected by checking `locals.user`.

## Deliverables

### 1. API route — `templates/starter-cloudflare/src/pages/_brand/logo.ts`

GET handler:
- Read R2 object with key `"brand/logo"` from `locals.runtime.env.MEDIA`
- If found: serve with its `httpMetadata.contentType` and `Cache-Control: public, max-age=3600`
- If not found: redirect 302 to `/brand/logo-default.svg`

POST handler:
- Check `locals.user` exists; if not, return 401 JSON `{ error: "Unauthorized" }`
- Check user role — use `locals.user.role` or call `requirePerm`. If not at least `admin`, return 403
  - NOTE: `requirePerm` is from EmDash's internal `#api/authorize.js` path alias which only resolves inside `packages/core`. For this custom Astro page in the starter template, do a simple role check instead:
    ```ts
    if (!locals.user || !["admin", "superadmin"].includes(locals.user.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    ```
- Parse `multipart/form-data`, extract the `logo` field (a File)
- Validate MIME type — allow only: `image/svg+xml`, `image/png`, `image/jpeg`, `image/webp`
- Validate file size — max 512 KB (512 * 1024 bytes)
- Put to R2: `await env.MEDIA.put("brand/logo", file.stream(), { httpMetadata: { contentType: file.type } })`
- Return 200 JSON `{ ok: true, url: "/_brand/logo" }`

DELETE handler (bonus, skip if time-constrained):
- Admin only
- Delete R2 object: `await env.MEDIA.delete("brand/logo")`
- Return 200 JSON `{ ok: true }`

Route file structure:
```ts
export const prerender = false;

import type { APIRoute } from "astro";

const R2_KEY = "brand/logo";
const ALLOWED_TYPES = new Set(["image/svg+xml", "image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 512 * 1024;

export const GET: APIRoute = async ({ locals }) => { ... };
export const POST: APIRoute = async ({ request, locals }) => { ... };
```

TypeScript: `locals.runtime.env` is typed as `Cloudflare.Env` (from `worker-configuration.d.ts`) — no cast needed if you declare `const env = locals.runtime.env as Env`. The global `Env` interface extends `Cloudflare.Env`, so `env.MEDIA` is typed as `R2Bucket`.

### 2. React component — `templates/starter-cloudflare/src/brand/LogoSettings.tsx`

A standalone React component for uploading a logo. It does NOT need to be wired into EmDash's plugin admin panel for now.

```tsx
import * as React from "react";

export function LogoSettings() {
  const [status, setStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState(`/_brand/logo?t=${Date.now()}`);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMsg(null);

    const body = new FormData();
    body.append("logo", file);

    try {
      const res = await fetch("/_brand/logo", { method: "POST", body });
      if (res.ok) {
        setPreviewUrl(`/_brand/logo?t=${Date.now()}`);
        setStatus("success");
      } else {
        const data = await res.json() as { error?: string };
        setErrorMsg(data.error ?? "Upload failed");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <h3 style={{ margin: 0 }}>Site Logo</h3>
      <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 6 }}>
        <img src={previewUrl} alt="Current logo" style={{ height: 40, objectFit: "contain", display: "block" }} />
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 14, color: "#374151" }}>
          Upload new logo — SVG, PNG, JPG, WEBP (max 512 KB)
        </span>
        <input
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          disabled={status === "uploading"}
        />
      </label>
      {status === "uploading" && <p style={{ color: "#6b7280", margin: 0 }}>Uploading…</p>}
      {status === "success" && <p style={{ color: "#16a34a", margin: 0 }}>Logo updated successfully.</p>}
      {status === "error" && <p style={{ color: "#dc2626", margin: 0 }}>{errorMsg}</p>}
    </div>
  );
}
```

### 3. Astro settings page — `templates/starter-cloudflare/src/pages/_brand/settings.astro`

A standalone Astro page that renders LogoSettings. Protected by a simple auth check.

```astro
---
export const prerender = false;
import { LogoSettings } from "../../brand/LogoSettings";

const { user } = Astro.locals;
if (!user || !["admin", "superadmin"].includes(user.role)) {
  return Astro.redirect("/_emdash/admin");
}
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site Logo — MCT CMS</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f9fafb; }
    main { max-width: 500px; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #111827; }
    a { color: #1a56db; text-decoration: none; font-size: 14px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <a href="/_emdash/admin">← Back to Admin</a>
    <h1>Site Logo Settings</h1>
    <LogoSettings client:load />
  </main>
</body>
</html>
```

### 4. Update `templates/starter-cloudflare/astro.config.mjs`

Change the `logo` value from the static SVG path to the dynamic API endpoint:

```js
admin: { siteName: "MCT CMS", logo: "/_brand/logo", favicon: "/brand/favicon.svg" },
```

This makes all BrandLogo/BrandIcon instances across the admin (login page, sidebar) serve from the R2-backed dynamic endpoint.

## What NOT to do

- Do NOT create a `wrangler.toml` — the repo uses `wrangler.jsonc` which already has the MEDIA R2 binding
- Do NOT try to register as an EmDash native plugin (complex module resolution, skip for POC)
- Do NOT modify `packages/` — all changes go in `templates/starter-cloudflare/`
- Do NOT use `emdash.storage` abstraction — access `locals.runtime.env.MEDIA` directly for this custom endpoint

## TypeScript notes

- `locals.runtime` is typed via Astro's Cloudflare adapter. You may need: `const env = locals.runtime?.env as Env` if the type doesn't expose it directly.
- `user.role` — check what fields are on `locals.user` by reading `packages/core/src/astro/locals.ts` or the emdash locals declaration.

## After implementation

Read `packages/core/src/astro/locals.ts` to confirm the exact fields on `locals.user` (specifically what the role field is named and what values it takes). Adjust the role check accordingly.

Commit with message: `feat: per-client logo upload via R2`

Write a report to `.superpowers/sdd/task-5-report.md` summarizing:
- Files created/modified
- Commit hash
- Any TypeScript issues encountered and how resolved
- The exact role field name found on `locals.user`
