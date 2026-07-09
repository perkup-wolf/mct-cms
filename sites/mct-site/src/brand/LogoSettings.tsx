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
				const data = (await res.json()) as { error?: string };
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
