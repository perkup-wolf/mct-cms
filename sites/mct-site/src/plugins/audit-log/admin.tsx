import * as React from "react";
import type { PluginAdminExports } from "emdash";

interface AuditEntry {
  id: string;
  data: {
    category: "content" | "user" | "system";
    action: string;
    occurred_at: string;
    record_type?: string;
    record_id?: string;
    meta?: Record<string, unknown>;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  content: "#1a56db",
  user: "#7c3aed",
  system: "#d97706",
};

function AuditLogPage() {
  const [items, setItems] = React.useState<AuditEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [cursor, setCursor] = React.useState<string | undefined>();
  const [hasMore, setHasMore] = React.useState(false);
  const [category, setCategory] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function load(resetCursor = true) {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { limit: 50 };
      if (category) body.category = category;
      if (from) body.from = from;
      if (to) body.to = to;
      if (!resetCursor && cursor) body.cursor = cursor;

      const res = await fetch("/_emdash/api/plugins/audit-log/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { data: { items: AuditEntry[]; hasMore: boolean; cursor?: string } };
      const data = json.data;

      if (resetCursor) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
      setCursor(data.cursor);
      setTotal(prev => resetCursor ? data.items.length : prev + data.items.length);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void load(true); }, [category, from, to]);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Activity Log</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
        >
          <option value="">All categories</option>
          <option value="content">Content</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", borderRadius: 4, border: "1px solid #d1d5db" }}
          placeholder="To"
        />
        <button
          onClick={() => { setCategory(""); setFrom(""); setTo(""); }}
          style={{ padding: "0.375rem 0.75rem", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}
        >
          Clear
        </button>
      </div>

      {loading && items.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No events found.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Time</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Action</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>Record</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {new Date(item.data.occurred_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span style={{
                      background: (CATEGORY_COLORS[item.data.category] ?? "#6b7280") + "20",
                      color: CATEGORY_COLORS[item.data.category] ?? "#6b7280",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      {item.data.category}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{item.data.action}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "#6b7280" }}>
                    {item.data.record_type
                      ? `${item.data.record_type}${item.data.record_id ? ` #${item.data.record_id}` : ""}`
                      : item.data.meta ? JSON.stringify(item.data.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => void load(false)}
                disabled={loading}
                style={{ padding: "0.5rem 1rem", borderRadius: 4, border: "1px solid #d1d5db", cursor: "pointer" }}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const pages: PluginAdminExports["pages"] = {
  "/": AuditLogPage,
};
