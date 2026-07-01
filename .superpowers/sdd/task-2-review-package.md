# Task 2 Review Package
## Commits (13b87b70..41c68c03)
41c68c03 chore: map branding touchpoints

## Diff stat
 BRANDING_MAP.md | 181 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 181 insertions(+)

## Full diff
diff --git a/BRANDING_MAP.md b/BRANDING_MAP.md
new file mode 100644
index 00000000..a30b5e4f
--- /dev/null
+++ b/BRANDING_MAP.md
@@ -0,0 +1,181 @@
+# Branding Map
+
+Complete inventory of every file and line that must change to white-label this CMS.
+
+---
+
+## Logo Components
+
+- `packages/admin/src/components/Logo.tsx` — Contains four exports:
+  - `LogoIcon` (lines 7–60): EmDash icon mark SVG (rounded-rect em-dash symbol with gradient). Replace or keep as fallback.
+  - `LogoLockup` (lines 66–148): Full logo lockup SVG with "EmDash" wordmark (aria-label="EmDash" on line 74). Replace or keep as fallback.
+  - `BrandLogo` (lines 150–168): Accepts `logoUrl?` and `siteName?`; renders custom `<img>` when `logoUrl` is provided, else falls back to `<LogoLockup>`. Ready for white-labelling.
+  - `BrandIcon` (lines 170–188): Accepts `logoUrl?` and `siteName?`; renders custom `<img>` when `logoUrl` is provided, else falls back to `<LogoIcon>`. Ready for white-labelling.
+
+- `packages/admin/src/components/LoginPage.tsx:214` — `<BrandLogo className="h-10 mb-4" />` (loading state) — missing `logoUrl` and `siteName` props.
+- `packages/admin/src/components/LoginPage.tsx:226` — `<BrandLogo className="h-10 mx-auto mb-2" />` (login card header) — missing `logoUrl` and `siteName` props.
+
+- `packages/admin/src/components/Sidebar.tsx:425–429` — `<BrandIcon>` with props already wired:
+  ```jsx
+  <BrandIcon
+    logoUrl={manifest.admin?.logo}
+    siteName={manifest.admin?.siteName}
+    className="size-5 shrink-0"
+    aria-hidden="true"
+  />
+  ```
+  This is already white-label-ready — it reads from `manifest.admin`.
+
+- `packages/admin/src/components/Sidebar.tsx:432` — Sidebar display name falls back to hardcoded `"EmDash"`:
+  ```jsx
+  <span className="font-semibold truncate ...">
+    {manifest.admin?.siteName || "EmDash"}
+  </span>
+  ```
+
+- `packages/admin/src/components/Sidebar.tsx:485` — Footer version text falls back to hardcoded `"EmDash CMS"`:
+  ```jsx
+  {manifest.admin?.siteName || "EmDash CMS"} v{manifest.version || "0.0.0"}
+  ```
+
+---
+
+## CSS / Colors
+
+- `packages/admin/src/styles.css:32–37` — `[data-theme="classic"]` block with brand color overrides:
+  ```css
+  [data-theme="classic"] {
+    --color-kumo-brand: #2271b1;
+    --color-kumo-brand-hover: #135e96;
+    --text-color-kumo-brand: #2271b1;
+  }
+  ```
+  To add company CI: add a new `[data-theme="company"]` block with custom `--color-kumo-brand` values.
+
+- `packages/admin/src/styles.css:82–86` — `--font-emdash` CSS variable comment references EmDash branding (`--font-emdash is set by the Astro Font API`). The font variable name is a code identifier; rename if full white-labelling is required.
+
+---
+
+## Admin Shell (HTML page title and boot loader)
+
+- `packages/core/src/astro/routes/admin.astro:26` — Page `<title>` falls back to `"EmDash Admin"`:
+  ```ts
+  const pageTitle = adminConfig?.siteName ? `${adminConfig.siteName} Admin` : "EmDash Admin";
+  ```
+
+- `packages/core/src/astro/routes/admin.astro:36–43` — Favicon falls back to inline EmDash SVG data URI when no `adminConfig?.favicon` is set.
+
+- `packages/core/src/astro/routes/admin.astro:96` — Boot loader paragraph falls back to `"Loading EmDash..."`:
+  ```ts
+  {adminConfig?.siteName ? `Loading ${adminConfig.siteName}...` : "Loading EmDash..."}
+  ```
+
+---
+
+## Admin Config Wiring (where `admin.*` is set)
+
+- `packages/core/src/astro/integration/runtime.ts:570–593` — `EmDashConfig.admin` interface definition: `logo?`, `siteName?`, `favicon?`. This is where integrators pass white-label settings:
+  ```ts
+  emdash({
+    admin: {
+      logo: "/images/agency-logo.webp",
+      siteName: "AgencyX CMS",
+      favicon: "/favicon.ico",
+    },
+  })
+  ```
+  These values flow through `Astro.locals.emdash.config.admin` → manifest API → React SPA.
+
+- `packages/core/src/astro/routes/api/manifest.ts:42` — `adminBranding = emdash?.config?.admin` is read and embedded into the manifest JSON served to the React SPA.
+
+---
+
+## Email Templates
+
+`siteName` in all email templates is read at request-time from the `"emdash:site_title"` key in the options DB table (set via the admin Settings UI). The auth package functions receive it as a config parameter.
+
+- `packages/auth/src/invite.ts:22–27` — `InviteConfig` interface defines `siteName: string`.
+- `packages/auth/src/invite.ts:80–103` — `buildInviteEmail()` uses `siteName` in subject (`"You've been invited to ${siteName}"`) and HTML heading (line 94).
+- `packages/auth/src/invite.ts:85` — Plain-text body uses `siteName`.
+
+- `packages/auth/src/magic-link/index.ts:14–19` — `MagicLinkConfig` interface defines `siteName: string`.
+- `packages/auth/src/magic-link/index.ts:70–73` — `sendMagicLink()` uses `siteName` in subject (`"Sign in to ${siteName}"`) and HTML heading (line 83).
+
+- `packages/auth/src/signup.ts:23–28` — `SignupConfig` interface defines `siteName: string`.
+- `packages/auth/src/signup.ts:98–112` — `requestSignup()` uses `siteName` in subject (`"Verify your email for ${siteName}"`) and HTML body (line 112: `"create your ${safeName} account"`).
+
+---
+
+## siteName Configuration
+
+`siteName` for email templates is read dynamically from the database at request-time — it is **not** hard-coded in config files. The value is stored as `"emdash:site_title"` in the options table and surfaced by:
+
+- `packages/core/src/astro/routes/api/auth/invite/index.ts:47` — `const siteName = (await options.get<string>("emdash:site_title")) || "EmDash";`
+- `packages/core/src/astro/routes/api/auth/magic-link/send.ts:63` — `const siteName = (await options.get<string>("emdash:site_title")) ?? "EmDash";`
+- `packages/core/src/astro/routes/api/auth/signup/request.ts:69` — `const siteName = (await options.get<string>("emdash:site_title")) || "EmDash";`
+- `packages/core/src/astro/routes/api/well-known/auth.ts:25,29` — Defaults to `"EmDash"` if not set in DB.
+- `packages/core/src/astro/routes/api/settings/email.ts:110` — Test email also defaults to `"EmDash"`.
+
+**To white-label email sender name:** set `emdash:site_title` via the admin Settings UI, or seed it in the database directly. No code change required for email.
+
+**To white-label admin UI name/logo/favicon:** pass `admin: { siteName, logo, favicon }` to `emdash()` in `astro.config.mjs`. See `packages/core/src/astro/integration/runtime.ts:570`.
+
+---
+
+## "EmDash" Product Name Strings (user-visible, non-code-identifier)
+
+These are the strings that appear in the running app or in generated artifacts:
+
+| File | Line | Text |
+|------|------|------|
+| `packages/admin/src/components/Sidebar.tsx` | 432 | `"EmDash"` (sidebar name fallback) |
+| `packages/admin/src/components/Sidebar.tsx` | 485 | `"EmDash CMS"` (footer version fallback) |
+| `packages/core/src/astro/routes/admin.astro` | 26 | `"EmDash Admin"` (page title fallback) |
+| `packages/core/src/astro/routes/admin.astro` | 96 | `"Loading EmDash..."` (boot loader fallback) |
+| `packages/core/src/astro/routes/api/auth/invite/index.ts` | 47 | `"EmDash"` (siteName fallback for invite email) |
+| `packages/core/src/astro/routes/api/auth/magic-link/send.ts` | 63 | `"EmDash"` (siteName fallback for magic-link email) |
+| `packages/core/src/astro/routes/api/auth/signup/request.ts` | 69 | `"EmDash"` (siteName fallback for signup email) |
+| `packages/core/src/astro/routes/api/well-known/auth.ts` | 25, 29 | `"EmDash"` (well-known auth name fallback) |
+| `packages/core/src/astro/routes/api/settings/email.ts` | 110 | `"EmDash"` (test email siteName fallback) |
+| `packages/core/src/astro/routes/api/admin/users/[id]/send-recovery.ts` | 57 | `"EmDash"` (recovery email siteName fallback) |
+| `templates/starter-cloudflare/src/utils/site-identity.ts` | 16 | `"Built with EmDash"` (default tagline in starter template) |
+| `infra/plugins-site/public/index.html` | 6, 26 | `"EmDash Plugin Registry"` / `"EmDash Plugin Registry"` heading |
+| `i18n/build.ts` | 109, 110, 144 | `"EmDash Translation Status"` page title and heading |
+
+**Note:** The `.flue/` workflow files, `e2e/` test files, `demos/`, and `fixtures/` directories also reference "EmDash" extensively, but these are dev/CI/demo artifacts — not user-facing production code.
+
+---
+
+## "Powered by" / emdashcms.com References
+
+These appear in the **front-end site templates** (not the admin), as footer attribution links:
+
+| File | Line | Text |
+|------|------|------|
+| `fixtures/perf-site/src/layouts/Base.astro` | 194 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `infra/cache-demo/src/layouts/Base.astro` | 197 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `infra/blog-demo/src/layouts/Base.astro` | 197 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `infra/do-demo/src/layouts/Base.astro` | 197 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `infra/do-solo-demo/src/layouts/Base.astro` | 197 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `demos/simple/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `demos/cloudflare/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `demos/playground/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `demos/preview/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `demos/postgres/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/blog/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/blog-cloudflare/src/layouts/Base.astro` | 202 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/portfolio/src/layouts/Base.astro` | 128 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/portfolio-cloudflare/src/layouts/Base.astro` | 128 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/marketing/src/layouts/Base.astro` | 158 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `templates/marketing-cloudflare/src/layouts/Base.astro` | 158 | `Powered by <a href="https://emdashcms.com">EmDash</a>` |
+| `packages/cloudflare/src/db/playground-middleware.ts` | 38 | `playground@emdashcms.com` (playground user email — internal) |
+| `packages/plugin-cli/src/config.ts` | 22 | `"https://registry.emdashcms.com"` (default aggregator URL — internal) |
+| `packages/core/src/cli/commands/publish.ts` | 31 | `"https://marketplace.emdashcms.com"` (default registry — internal) |
+| `apps/aggregator/src/index.ts` | 42 | `https://api.emdashcms.com/_admin/start` (API comment — internal) |
+| `i18n/build.ts` | 111 | `https://i18n.emdashcms.com/` (canonical URL in i18n dashboard — internal) |
+
+---
+
+## wrangler.toml Location
+
+None found. The repository has no `wrangler.toml` files anywhere (including `apps/`, `packages/cloudflare/`, `templates/`, `demos/`). Cloudflare configuration (D1 binding name `DB`, R2 binding `MEDIA`) is passed programmatically via `d1({ binding: "DB" })` and `r2({ binding: "MEDIA" })` in `astro.config.mjs` (see `templates/starter-cloudflare/astro.config.mjs`). Consumers of this package are expected to provide their own `wrangler.toml`.
