import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provisionClient } from './provision';

describe('provisionClient', () => {
  const env = {
    CF_API_TOKEN: 'test-token',
    CF_ACCOUNT_ID: 'acct-123',
    CF_ZONE_ID: 'zone-456',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('calls Cloudflare API to create D1, R2, and custom hostname', async () => {
    const mockFetch = vi.mocked(fetch);
    // D1 create
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, result: { uuid: 'db-abc' }, errors: [] })),
    );
    // R2 create
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, result: {}, errors: [] })),
    );
    // Custom hostname
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, result: {}, errors: [] })),
    );

    const result = await provisionClient(env, {
      slug: 'acme',
      adminEmail: 'a@acme.com',
      domain: 'acme.com',
    });

    expect(result.dbId).toBe('db-abc');
    expect(result.r2Bucket).toBe('cms-acme-media');
    expect(result.workerId).toBe('cms-acme');
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify the zone-level URL was used for custom hostname
    const hostnameCall = mockFetch.mock.calls[2];
    expect(hostnameCall[0]).toContain(`zones/${env.CF_ZONE_ID}/custom_hostnames`);
    expect(hostnameCall[0]).not.toContain('accounts');
  });

  it('throws when Cloudflare API returns success: false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, result: null, errors: [{ message: 'Invalid token' }] }),
      ),
    );

    await expect(
      provisionClient(env, { slug: 'acme', adminEmail: 'a@acme.com', domain: 'acme.com' }),
    ).rejects.toThrow('Cloudflare API error');
  });
});
