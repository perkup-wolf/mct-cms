import { describe, it, expect, vi } from 'vitest';
import { createClient, updateClientStatus, getClients } from './db';

function mockDb(firstResult: unknown = null, allResult: unknown[] = []) {
  const run = vi.fn().mockResolvedValue({ meta: { last_row_id: 1, changes: 1 } });
  const first = vi.fn().mockResolvedValue(firstResult);
  const all = vi.fn().mockResolvedValue({ results: allResult });
  const bind = vi.fn().mockReturnValue({ run, first, all });
  const prepare = vi.fn().mockReturnValue({ bind, run, first, all });
  return { prepare } as any;
}

describe('createClient', () => {
  it('inserts a client and returns its id', async () => {
    const db = mockDb();
    const id = await createClient(db, {
      name: 'Acme', slug: 'acme', domain: 'acme.com', admin_email: 'a@acme.com',
    });
    expect(id).toBe(1);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO clients'));
  });
});

describe('updateClientStatus', () => {
  it('updates status only when no extra fields', async () => {
    const db = mockDb();
    await updateClientStatus(db, 1, 'active');
    expect(db.prepare).toHaveBeenCalledWith('UPDATE clients SET status = ? WHERE id = ?');
  });

  it('updates status and worker_name together', async () => {
    const db = mockDb();
    await updateClientStatus(db, 1, 'active', { worker_name: 'cms-acme' });
    expect(db.prepare).toHaveBeenCalledWith(
      'UPDATE clients SET status = ?, worker_name = ? WHERE id = ?'
    );
  });
});

describe('getClients', () => {
  it('returns all clients ordered by created_at desc', async () => {
    const clients = [{ id: 1, name: 'Acme' }];
    const db = mockDb(null, clients);
    const result = await getClients(db);
    expect(result).toEqual(clients);
  });
});
