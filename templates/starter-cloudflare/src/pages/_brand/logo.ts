import type { APIRoute } from "astro";

export const prerender = false;

const R2_KEY = "brand/logo";
const ALLOWED_TYPES = new Set(["image/svg+xml", "image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 512 * 1024;

export const GET: APIRoute = async ({ locals }) => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Astro Cloudflare runtime env
		const env = locals.runtime?.env as any;
		if (!env?.MEDIA) {
			return new Response(null, { status: 302, headers: { Location: "/brand/logo-default.svg" } });
		}

		const object = await env.MEDIA.get(R2_KEY);
		if (!object) {
			return new Response(null, { status: 302, headers: { Location: "/brand/logo-default.svg" } });
		}

		const contentType = object.httpMetadata?.contentType ?? "image/svg+xml";
		return new Response(object.body, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=3600",
			},
		});
	} catch {
		// Fall back to default logo on any error
		return new Response(null, { status: 302, headers: { Location: "/brand/logo-default.svg" } });
	}
};

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Astro Cloudflare runtime env
		const env = locals.runtime?.env as any;
		if (!env?.MEDIA) {
			return new Response(JSON.stringify({ error: "R2 not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
		}

		// Check authentication
		if (!locals.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
		}

		// Check authorization - admin role only
		// Role is numeric in User type: ADMIN = 50
		const isAdmin = locals.user.role >= 50;
		if (!isAdmin) {
			return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
		}

		// Parse form data
		const formData = await request.formData();
		const file = formData.get("logo") as File | null;

		if (!file) {
			return new Response(JSON.stringify({ error: "Missing logo file" }), { status: 400, headers: { "Content-Type": "application/json" } });
		}

		// Validate MIME type
		if (!ALLOWED_TYPES.has(file.type)) {
			return new Response(
				JSON.stringify({ error: "Invalid file type. Allowed: SVG, PNG, JPEG, WebP" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Validate file size
		if (file.size > MAX_SIZE) {
			return new Response(
				JSON.stringify({ error: `File too large. Max size: 512 KB` }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Upload to R2
		const buffer = await file.arrayBuffer();
		await env.MEDIA.put(R2_KEY, buffer, {
			httpMetadata: { contentType: file.type },
		});

		return new Response(JSON.stringify({ ok: true, url: "/_brand/logo" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: `Upload failed: ${message}` }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE: APIRoute = async ({ locals }) => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Astro Cloudflare runtime env
		const env = locals.runtime?.env as any;
		if (!env?.MEDIA) {
			return new Response(JSON.stringify({ error: "R2 not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
		}

		// Check authentication
		if (!locals.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
		}

		// Check authorization - admin role only
		const isAdmin = locals.user.role >= 50;
		if (!isAdmin) {
			return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
		}

		// Delete from R2
		await env.MEDIA.delete(R2_KEY);

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: `Delete failed: ${message}` }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
