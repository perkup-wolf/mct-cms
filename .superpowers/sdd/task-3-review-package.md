# Task 3 Review Package
## Commits (41c68c03..303555b8)
303555b8 feat: apply company CI colors and MCT CMS name

## Diff stat
 packages/admin/src/components/LoginPage.tsx   | 20 +++++++++++++++++---
 packages/admin/src/styles.css                 | 11 +++++++++++
 templates/starter-cloudflare/astro.config.mjs |  1 +
 3 files changed, 29 insertions(+), 3 deletions(-)

## Full diff
diff --git a/packages/admin/src/components/LoginPage.tsx b/packages/admin/src/components/LoginPage.tsx
index 7dfb5f7d..a31daee9 100644
--- a/packages/admin/src/components/LoginPage.tsx
+++ b/packages/admin/src/components/LoginPage.tsx
@@ -12,21 +12,21 @@
  * When external auth (e.g., Cloudflare Access) is configured, this page
  * redirects to the admin dashboard since authentication is handled externally.
  */
 
 import { Button, Input, Loader, Select } from "@cloudflare/kumo";
 import { Trans, useLingui } from "@lingui/react/macro";
 import { useQuery } from "@tanstack/react-query";
 import { Link } from "@tanstack/react-router";
 import * as React from "react";
 
-import { apiFetch, fetchAuthMode } from "../lib/api";
+import { apiFetch, fetchAuthMode, fetchManifest } from "../lib/api";
 import { useAuthProviderList } from "../lib/auth-provider-context";
 import { sanitizeRedirectUrl } from "../lib/url";
 import { SUPPORTED_LOCALES } from "../locales/index.js";
 import { useLocale } from "../locales/useLocale.js";
 import { PasskeyLogin } from "./auth/PasskeyLogin";
 import { BrandLogo } from "./Logo.js";
 
 // ============================================================================
 // Types
 // ============================================================================
@@ -171,20 +171,26 @@ export function LoginPage({ redirectUrl = "/_emdash/admin" }: LoginPageProps) {
 
 	// Auth provider components from virtual module (via context)
 	const authProviderList = useAuthProviderList();
 
 	// Fetch auth mode from public endpoint (works without authentication)
 	const { data: authInfo, isLoading: authModeLoading } = useQuery({
 		queryKey: ["authMode"],
 		queryFn: fetchAuthMode,
 	});
 
+	// Fetch manifest to get admin branding (siteName, logo)
+	const { data: manifest } = useQuery({
+		queryKey: ["manifest"],
+		queryFn: fetchManifest,
+	});
+
 	// Redirect to admin when using external auth (authentication is handled externally)
 	React.useEffect(() => {
 		if (authInfo?.authMode && authInfo.authMode !== "passkey") {
 			window.location.href = safeRedirectUrl;
 		}
 	}, [authInfo, safeRedirectUrl]);
 
 	// Check for error in URL (from OAuth/provider redirect)
 	React.useEffect(() => {
 		const params = new URLSearchParams(window.location.search);
@@ -204,33 +210,41 @@ export function LoginPage({ redirectUrl = "/_emdash/admin" }: LoginPageProps) {
 	};
 
 	// All providers with a LoginButton show in the button grid
 	const buttonProviders = authProviderList.filter((p) => p.LoginButton);
 
 	// Show loading state while checking auth mode
 	if (authModeLoading || (authInfo?.authMode && authInfo.authMode !== "passkey")) {
 		return (
 			<div className="min-h-screen flex items-center justify-center bg-kumo-base p-4">
 				<div className="flex flex-col items-center">
-					<BrandLogo className="h-10 mb-4" />
+					<BrandLogo
+						logoUrl={manifest?.admin?.logo}
+						siteName={manifest?.admin?.siteName}
+						className="h-10 mb-4"
+					/>
 					<Loader />
 				</div>
 			</div>
 		);
 	}
 
 	return (
 		<div className="min-h-screen flex items-center justify-center bg-kumo-base p-4">
 			<div className="w-full max-w-md">
 				{/* Header */}
 				<div className="text-center mb-8">
-					<BrandLogo className="h-10 mx-auto mb-2" />
+					<BrandLogo
+						logoUrl={manifest?.admin?.logo}
+						siteName={manifest?.admin?.siteName}
+						className="h-10 mx-auto mb-2"
+					/>
 					<h1 className="text-2xl font-semibold text-kumo-default">
 						{method === "magic-link"
 							? t`Sign in with email`
 							: activeProvider
 								? t`Sign in with ${authProviderList.find((p) => p.id === activeProvider)?.label ?? activeProvider}`
 								: t`Sign in to your site`}
 					</h1>
 				</div>
 
 				{/* Error from URL (provider failure) */}
diff --git a/packages/admin/src/styles.css b/packages/admin/src/styles.css
index 3486d13e..58b27df0 100644
--- a/packages/admin/src/styles.css
+++ b/packages/admin/src/styles.css
@@ -29,20 +29,31 @@
  * Overrides kumo CSS custom properties with classic CMS admin values.
  * Applied via data-theme="classic" on <html> so portals inherit too.
  */
 [data-theme="classic"] {
 	/* Primary brand blue */
 	--color-kumo-brand: #2271b1;
 	--color-kumo-brand-hover: #135e96;
 	--text-color-kumo-brand: #2271b1;
 }
 
+[data-theme="company"] {
+  --color-kumo-brand: #1a56db;
+  --color-kumo-brand-hover: #1648c4;
+  --text-color-kumo-brand: #1a56db;
+}
+
+[data-theme="company"]:not([data-mode="dark"]) {
+  --color-kumo-ring: #1a56db;
+  --text-color-kumo-link: #1a56db;
+}
+
 [data-theme="classic"]:not([data-mode="dark"]) {
 	/* Surfaces */
 	--color-kumo-canvas: oklch(98.75% 0 0);
 	--color-kumo-base: #ffffff;
 	--color-kumo-elevated: oklch(98.75% 0 0);
 	--color-kumo-recessed: #dcdcde;
 	--color-kumo-overlay: #ffffff;
 	--color-kumo-control: #ffffff;
 	--color-kumo-tint: #f0f0f1;
 	--color-kumo-fill: #dcdcde;
diff --git a/templates/starter-cloudflare/astro.config.mjs b/templates/starter-cloudflare/astro.config.mjs
index 1f013579..1ab16622 100644
--- a/templates/starter-cloudflare/astro.config.mjs
+++ b/templates/starter-cloudflare/astro.config.mjs
@@ -9,14 +9,15 @@ export default defineConfig({
 	adapter: cloudflare(),
 	image: {
 		layout: "constrained",
 		responsiveStyles: true,
 	},
 	integrations: [
 		react(),
 		emdash({
 			database: d1({ binding: "DB", session: "auto" }),
 			storage: r2({ binding: "MEDIA" }),
+			admin: { siteName: "MCT CMS" },
 		}),
 	],
 	devToolbar: { enabled: false },
 });
