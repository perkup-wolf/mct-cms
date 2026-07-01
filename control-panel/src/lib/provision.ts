interface ProvisionOptions {
  slug: string;
  adminEmail: string;
  domain: string;
}

interface ProvisionResult {
  workerId: string;
  dbId: string;
  r2Bucket: string;
}

async function cfFetch(
  token: string,
  accountId: string,
  path: string,
  opts: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
  });

  const json = (await res.json()) as { success: boolean; result: unknown; errors: unknown[] };
  if (!json.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

export async function provisionClient(
  env: { CF_API_TOKEN: string; CF_ACCOUNT_ID: string; CF_ZONE_ID: string },
  opts: ProvisionOptions,
): Promise<ProvisionResult> {
  const { CF_API_TOKEN: token, CF_ACCOUNT_ID: accountId, CF_ZONE_ID: zoneId } = env;
  const { slug } = opts;

  // 1. Create D1 database
  const dbResult = (await cfFetch(token, accountId, '/d1/database', {
    method: 'POST',
    body: JSON.stringify({ name: `cms-${slug}` }),
  })) as { uuid: string };
  const dbId = dbResult.uuid;

  // 2. Create R2 bucket
  await cfFetch(token, accountId, `/r2/buckets`, {
    method: 'POST',
    body: JSON.stringify({ name: `cms-${slug}-media` }),
  });
  const r2Bucket = `cms-${slug}-media`;

  // 3. Deploy Worker (upload script via API)
  // The Worker script is the built EmDash fork — upload dist/_worker.js
  // This step assumes the fork is pre-built and the script content is available
  // In practice, the Control Panel triggers a Cloudflare Pages deployment or
  // uses wrangler deploy via a CI pipeline. For the POC, we record the worker name.
  const workerId = `cms-${slug}`;

  // 4. Create Custom Hostname for client domain (zone-level resource, not account-level)
  const hostnameRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname: `cms.${opts.domain}`,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
      }),
    },
  );
  const hostnameJson = (await hostnameRes.json()) as {
    success: boolean;
    result: unknown;
    errors: unknown[];
  };
  if (!hostnameJson.success) {
    throw new Error(`Cloudflare API error: ${JSON.stringify(hostnameJson.errors)}`);
  }

  return { workerId, dbId, r2Bucket };
}
