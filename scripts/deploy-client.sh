#!/usr/bin/env bash
# deploy-client.sh — Provision and deploy a new MCT CMS client instance
#
# Usage:
#   ./scripts/deploy-client.sh <client-name> <client-domain> <admin-email>
#
# Example:
#   ./scripts/deploy-client.sh "Acme Corp" "acme.com" "admin@acme.com"
#
# What it does:
#   1. Creates a Cloudflare D1 database (cms-<slug>)
#   2. Creates a Cloudflare R2 bucket (cms-<slug>-media)
#   3. Builds the worker (templates/starter-cloudflare)
#   4. Deploys the worker with client-specific bindings
#   5. Prints DNS setup instructions
#
# Prerequisites:
#   - wrangler CLI installed and authenticated (wrangler login)
#   - pnpm installed
#   - Run from the repo root

set -euo pipefail

CLIENT_NAME="${1:-}"
CLIENT_DOMAIN="${2:-}"
ADMIN_EMAIL="${3:-}"

if [[ -z "$CLIENT_NAME" || -z "$CLIENT_DOMAIN" || -z "$ADMIN_EMAIL" ]]; then
  echo "Usage: ./scripts/deploy-client.sh <client-name> <client-domain> <admin-email>"
  echo ""
  echo "Example:"
  echo "  ./scripts/deploy-client.sh 'Acme Corp' 'acme.com' 'admin@acme.com'"
  exit 1
fi

# Derive slug: lowercase, spaces to hyphens, strip non-alphanumeric (except hyphens)
SLUG=$(echo "$CLIENT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

WORKER_NAME="cms-${SLUG}"
DB_NAME="cms-${SLUG}"
BUCKET_NAME="cms-${SLUG}-media"
TEMPLATE_DIR="templates/starter-cloudflare"

echo ""
echo "=== MCT CMS Client Provisioner ==="
echo "Client:  ${CLIENT_NAME}"
echo "Slug:    ${SLUG}"
echo "Domain:  cms.${CLIENT_DOMAIN}"
echo "Admin:   ${ADMIN_EMAIL}"
echo "Worker:  ${WORKER_NAME}"
echo ""

# ── Step 1: Create D1 database ──────────────────────────────────────────────
echo "[1/4] Creating D1 database: ${DB_NAME}"
DB_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1)
echo "$DB_OUTPUT"

# Extract database_id from output (format: "database_id = \"<id>\"")
DB_ID=$(echo "$DB_OUTPUT" | grep 'database_id' | grep -oE '[0-9a-f-]{36}')
if [[ -z "$DB_ID" ]]; then
  echo "ERROR: Could not extract database_id from wrangler output."
  echo "Check if the database already exists: wrangler d1 list"
  exit 1
fi
echo "  → database_id: ${DB_ID}"

# ── Step 2: Create R2 bucket ─────────────────────────────────────────────────
echo ""
echo "[2/4] Creating R2 bucket: ${BUCKET_NAME}"
wrangler r2 bucket create "$BUCKET_NAME"
echo "  → bucket created"

# ── Step 3: Build the worker ─────────────────────────────────────────────────
echo ""
echo "[3/4] Building worker (${TEMPLATE_DIR})"
(cd "$TEMPLATE_DIR" && pnpm build)

# ── Step 4: Generate client wrangler config and deploy ──────────────────────
echo ""
echo "[4/4] Deploying worker: ${WORKER_NAME}"

# Write a temporary wrangler config with client-specific values
TEMP_CONFIG=$(mktemp /tmp/wrangler-XXXXXX.jsonc)
trap 'rm -f "$TEMP_CONFIG"' EXIT

cat > "$TEMP_CONFIG" <<JSON
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "${WORKER_NAME}",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-02-24",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "${DB_NAME}",
      "database_id": "${DB_ID}"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "${BUCKET_NAME}"
    }
  ],
  "worker_loaders": [
    {
      "binding": "LOADER"
    }
  ],
  "triggers": {
    "crons": ["* * * * *"]
  }
}
JSON

(cd "$TEMPLATE_DIR" && wrangler deploy --config "$TEMP_CONFIG")

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Deployment complete ==="
echo ""
echo "Worker URL: https://${WORKER_NAME}.<your-account>.workers.dev"
echo ""
echo "Next steps:"
echo "  1. Add a custom domain in the Cloudflare dashboard:"
echo "     Workers & Pages → ${WORKER_NAME} → Custom Domains → Add"
echo "     Set: cms.${CLIENT_DOMAIN} → ${WORKER_NAME}"
echo ""
echo "  2. Seed the database and create the first admin user:"
echo "     cd ${TEMPLATE_DIR}"
echo "     wrangler d1 execute ${DB_NAME} --remote --file seed/schema.sql  # if applicable"
echo "     # Then open https://cms.${CLIENT_DOMAIN}/_emdash/admin to complete setup"
echo ""
echo "  3. Set the site title in admin Settings → General → Site Title"
echo "     (controls email branding; default is 'MCT CMS')"
echo ""
echo "  4. Upload client logo at:"
echo "     https://cms.${CLIENT_DOMAIN}/_brand/settings"
echo ""
echo "  D1 database ID (save this): ${DB_ID}"
echo "  R2 bucket name: ${BUCKET_NAME}"
