# Task 2 Report: Explore and Map Branding Touchpoints

## Status: DONE

## Commit: 41c68c03

## Summary

Produced `BRANDING_MAP.md` at repo root cataloguing every branding touchpoint across admin UI components, CSS tokens, email templates, site templates, and configuration wiring.

---

## Key Findings

### Logo Components
- `Logo.tsx` — `BrandLogo` and `BrandIcon` already accept `logoUrl`/`siteName` props but `LoginPage.tsx` (lines 214, 226) does not pass them. `Sidebar.tsx` (lines 425–429) already passes them from `manifest.admin`.
- Sidebar also has two hardcoded fallback strings: `"EmDash"` (line 432) and `"EmDash CMS"` (line 485).
- `admin.astro` has three more hardcoded fallbacks: `"EmDash Admin"` (page title, line 26), inline EmDash SVG favicon (line 36–43), and `"Loading EmDash..."` (boot loader, line 96).

### CSS / Colors
- `styles.css:32–37` — `[data-theme="classic"]` sets `--color-kumo-brand: #2271b1`. Add a `[data-theme="company"]` block to inject CI colours.

### Email Templates
- All three auth packages (`invite.ts`, `magic-link/index.ts`, `signup.ts`) receive `siteName` as a config parameter — no hard-coded product strings in the email HTML.
- `siteName` is read at request-time from `"emdash:site_title"` in the options DB table across six core API routes. Default fallback is `"EmDash"` in every route.
- Changing the site title via admin Settings UI is sufficient to rebrand all email output.

### Admin Config Wiring
- `packages/core/src/astro/integration/runtime.ts:570–593` — The `admin: { logo, siteName, favicon }` block in `emdash()` is the single source of truth for admin UI white-labelling. Values flow through `Astro.locals.emdash.config.admin` → manifest API → React SPA.

### "EmDash" Product Name Strings
- 13 distinct user-visible fallback strings found across admin components, core routes, and the starter template.
- Dev/CI/test/demo references (`.flue/`, `e2e/`, `fixtures/`) not catalogued as production concerns.

### "Powered by" / emdashcms.com References
- 16 `Powered by <a href="https://emdashcms.com">EmDash</a>` occurrences across all demo/infra/template `Base.astro` layouts — these are in the front-end site (not admin).
- Several internal emdashcms.com URL references (registry, marketplace, playground email, i18n) — not user-facing product strings.

### wrangler.toml
- None found anywhere in the repo. Cloudflare bindings are configured programmatically via `d1()`/`r2()` in `astro.config.mjs`. Consumers supply their own `wrangler.toml`.
