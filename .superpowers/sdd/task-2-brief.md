# Task 2: Explore and Map Branding Touchpoints

## Context
You are working on a fork of EmDash CMS (perkup-wolf/mct-cms) at the repo root.
The goal is to produce BRANDING_MAP.md — a complete inventory of every file and line
that must change to white-label this CMS for a company.

## What we already know
- `packages/admin/src/components/Logo.tsx` — contains LogoIcon, LogoLockup, BrandLogo, BrandIcon.
  BrandLogo and BrandIcon already accept a `logoUrl` prop but it is NOT passed anywhere yet.
  They fall back to the EmDash SVG logo when no logoUrl is given.
- `packages/admin/src/components/LoginPage.tsx:214,226` — renders `<BrandLogo>` without logoUrl.
- `packages/admin/src/components/Sidebar.tsx` — imports and uses `<BrandIcon>` (check exact usage and props).
- `packages/admin/src/styles.css` — uses Kumo design system. Brand color overridden via
  `[data-theme="classic"] { --color-kumo-brand: #2271b1 }`. To add company CI, we add a new
  `[data-theme="company"]` block.
- `packages/auth/src/invite.ts` — inline email HTML, uses `siteName` config.
- `packages/auth/src/magic-link/index.ts` — inline email HTML, uses `siteName` config.
- `packages/auth/src/signup.ts` — inline email HTML, uses `siteName` config.

## Your task
1. Read each file listed above (full content where not yet read).
2. Search for any additional files referencing "EmDash" as a product name string (not code identifiers):
   ```
   grep -rn "EmDash" --include="*.tsx" --include="*.ts" --include="*.astro" --include="*.html" --include="*.css" .
   ```
3. Search for the "Powered by" or emdashcms.com footer references:
   ```
   grep -rn "emdashcms.com\|Powered by\|powered-by" --include="*.tsx" --include="*.ts" --include="*.astro" --include="*.html" .
   ```
4. Confirm where `siteName` is configured (search apps/ or packages/cloudflare/ for where auth packages are instantiated).
5. Find the wrangler.toml (if any) in apps/ or packages/cloudflare/:
   ```
   find . -name "wrangler.toml" -not -path "*/node_modules/*"
   ```
6. Check how BrandIcon is used in Sidebar.tsx (exact JSX and props).

## Deliverable
Create `BRANDING_MAP.md` at the repo root with this structure:

```markdown
# Branding Map

## Logo Components
- packages/admin/src/components/Logo.tsx — LogoIcon, LogoLockup (EmDash SVGs to replace or keep as fallback)
- packages/admin/src/components/LoginPage.tsx:LINE — <BrandLogo> missing logoUrl prop
- packages/admin/src/components/Sidebar.tsx:LINE — <BrandIcon> [note actual props]

## CSS / Colors
- packages/admin/src/styles.css:LINE — [data-theme="classic"] brand color override

## Email Templates
- packages/auth/src/invite.ts:LINE — siteName usage, HTML template
- packages/auth/src/magic-link/index.ts:LINE — siteName usage, HTML template
- packages/auth/src/signup.ts:LINE — siteName usage, HTML template

## siteName Configuration
- [file:LINE] — where siteName is set/passed to auth packages

## "EmDash" Product Name Strings
- [file:LINE] — [text found]

## "Powered by" / emdashcms.com References
- [file:LINE] — [text found]

## wrangler.toml Location
- [path] — [relevant bindings noted]
```

Fill in all LINE numbers with exact values. If a section has no results, write "None found."

## Commit
```bash
git add BRANDING_MAP.md
git commit -m "chore: map branding touchpoints"
```

## Report
Write your full report to: .superpowers/sdd/task-2-report.md
Return: status (DONE/BLOCKED/NEEDS_CONTEXT), commit hash, one-line test summary.
