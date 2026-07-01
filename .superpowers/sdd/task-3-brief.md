# Task 3: Apply Company CI — Colors and Name

## Context
You are working on a fork of EmDash CMS (perkup-wolf/mct-cms).
Task 2 produced BRANDING_MAP.md at the repo root — read it before making any changes.
The company is "Marco Technology Co., Ltd" — short name "MCT CMS".

## Primary branding mechanism (discovered in Task 2)
The main config entry point is `admin: { siteName, logo, favicon }` passed to `emdash()` in `astro.config.mjs`.
The starter template is at `templates/starter-cloudflare/astro.config.mjs` — read it to understand the current config shape.

## Files to change

### 1. `packages/admin/src/styles.css`
Add a new `[data-theme="company"]` CSS block after the existing `[data-theme="classic"]` block (around line 37):

```css
[data-theme="company"] {
  --color-kumo-brand: #1a56db;
  --color-kumo-brand-hover: #1648c4;
  --text-color-kumo-brand: #1a56db;
}

[data-theme="company"]:not([data-mode="dark"]) {
  --color-kumo-ring: #1a56db;
  --text-color-kumo-link: #1a56db;
}
```

These are placeholder CI colors — they can be updated later. Use these exact values.

### 2. `templates/starter-cloudflare/astro.config.mjs`
Add `admin.siteName` to the `emdash()` call. Read the file first to see the current shape.
Add: `admin: { siteName: "MCT CMS" }` inside the `emdash({})` call.
If `admin:` already exists, add `siteName: "MCT CMS"` to it.
Do NOT add `logo` or `favicon` here — those are Task 4 and Task 5.

### 3. `packages/admin/src/components/LoginPage.tsx` lines 214 and 226
These render `<BrandLogo>` without `logoUrl`/`siteName` props.
The component needs to receive `siteName` (and eventually `logoUrl`) from somewhere.

First, check how Sidebar.tsx gets `manifest.admin` (it uses a hook or context).
Search: `grep -n "manifest\|useManifest\|adminManifest" packages/admin/src/components/LoginPage.tsx`
Then search: `grep -rn "useManifest\|manifest\.admin\|adminConfig" packages/admin/src/ --include="*.tsx" --include="*.ts" -l`

Find the hook/context that provides `manifest.admin`, import it in LoginPage.tsx,
and pass `logoUrl={manifest.admin?.logo}` and `siteName={manifest.admin?.siteName}`
to both `<BrandLogo>` instances (lines 214 and 226).

## What NOT to change
- Do not touch email templates (siteName is set via admin Settings UI, no code change needed)
- Do not change any logo SVG files (Task 4)
- Do not add logo or favicon to astro.config.mjs (Task 4/5)
- Do not change the Sidebar (it already wires manifest.admin correctly)

## Verification
Run: `pnpm typecheck` from repo root — must pass with 0 errors.
(Do not run the dev server — it requires Cloudflare bindings.)

## Commit
```bash
git add packages/admin/src/styles.css
git add packages/admin/src/components/LoginPage.tsx
git add templates/starter-cloudflare/astro.config.mjs
git commit -m "feat: apply company CI colors and MCT CMS name"
```

## Report
Write your full report to: .superpowers/sdd/task-3-report.md
Include: what you changed, the typecheck result, and any questions.
Return: status (DONE/BLOCKED/NEEDS_CONTEXT), commit hash, one-line summary.
