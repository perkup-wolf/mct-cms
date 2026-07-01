# Task 4: Replace Default Logo

## Context
Working on perkup-wolf/mct-cms (EmDash fork) at repo root.
Company: Marco Technology Co., Ltd — short name "MCT CMS".

## What we know from earlier tasks
- `BrandLogo` / `BrandIcon` in `packages/admin/src/components/Logo.tsx` already accept `logoUrl` prop.
  If `logoUrl` is provided → renders an `<img>`. If not → falls back to the EmDash SVG.
- The config mechanism (Task 3) is `admin: { siteName, logo, favicon }` in `emdash()` in astro.config.mjs.
- `templates/starter-cloudflare/astro.config.mjs` already has `admin: { siteName: "MCT CMS" }`.
- Static files in Astro are served from the `public/` directory and accessible at root URL paths.

## Files to create/modify

### 1. Create `templates/starter-cloudflare/public/brand/logo-default.svg`
Create the directory and file. Use this placeholder MCT logo SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" fill="none">
  <rect width="200" height="48" rx="6" fill="#1a56db"/>
  <text x="16" y="32" font-family="system-ui, -apple-system, sans-serif"
        font-size="22" font-weight="700" fill="white" letter-spacing="-0.5">
    MCT CMS
  </text>
</svg>
```

### 2. Modify `templates/starter-cloudflare/astro.config.mjs`
Add `logo` to the existing `admin` block:

```js
admin: { siteName: "MCT CMS", logo: "/brand/logo-default.svg" },
```

### 3. Check for a `favicon` field in `AdminManifest`
Look at `packages/core/src/astro/routes/admin.astro` lines 36–43 (from BRANDING_MAP.md).
If `adminConfig?.favicon` is used there, also add `favicon: "/brand/favicon.svg"` to the admin config
AND create `templates/starter-cloudflare/public/brand/favicon.svg` using this minimal SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#1a56db"/>
  <text x="5" y="23" font-family="system-ui, sans-serif" font-size="16"
        font-weight="700" fill="white">M</text>
</svg>
```

If `admin.astro` does NOT use `adminConfig?.favicon` for the favicon (i.e. the field doesn't exist or isn't wired),
skip creating the favicon file and skip adding `favicon` to the config. Do not invent plumbing.

## What NOT to change
- Do not modify `Logo.tsx` — the component already handles fallback correctly.
- Do not modify `LoginPage.tsx` — already updated in Task 3.
- Do not modify `Sidebar.tsx`.
- Do not add any logo outside `templates/starter-cloudflare/`.

## Verification
Run from repo root: `pnpm typecheck`
Expected: 0 errors.

## Commit
```bash
git add templates/starter-cloudflare/public/brand/
git add templates/starter-cloudflare/astro.config.mjs
git commit -m "feat: add MCT CMS default logo and favicon"
```

## Report
Write to: .superpowers/sdd/task-4-report.md
Return: status (DONE/BLOCKED/NEEDS_CONTEXT), commit hash, one-line summary.
