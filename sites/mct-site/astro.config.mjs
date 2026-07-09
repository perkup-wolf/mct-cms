import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	i18n: {
		defaultLocale: "en",
		locales: ["en", "th"],
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Fraunces",
			cssVariable: "--font-display",
			weights: [500, 600, 700],
			styles: ["normal", "italic"],
		},
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600],
		},
	],
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			admin: { siteName: "MCT CMS", logo: "/brand/logo-default.svg", favicon: "/brand/favicon.svg" },
			plugins: [
				{
					id: "audit-log",
					version: "1.0.0",
					entrypoint: new URL("./src/plugins/audit-log/index.ts", import.meta.url).href,
					adminEntry: new URL("./src/plugins/audit-log/admin.tsx", import.meta.url).href,
					adminPages: [{ path: "/", label: "Activity Log", icon: "list" }],
				},
			],
		}),
	],
	devToolbar: { enabled: false },
	vite: {
		plugins: [tailwindcss()],
		define: {
			// @astrojs/cloudflare sets "process.env": "process.env" (passthrough) so the
			// Worker gets the real process via nodejs_compat. But the browser has no
			// process, so @lingui/core's `process.env.NODE_ENV !== "production"` check
			// throws. Override here: more-specific key wins in Vite's define lookup.
			"process.env.NODE_ENV": JSON.stringify("development"),
			"process.env": "{}",
		},
	},
});
