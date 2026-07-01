import type { D1Database } from '@cloudflare/workers-types';

export interface Client {
  id: number;
  name: string;
  slug: string;
  domain: string;
  admin_email: string;
  worker_name: string | null;
  db_id: string | null;
  r2_bucket: string | null;
  status: 'provisioning' | 'active' | 'error';
  created_at: string;
  last_checked: string | null;
}

export interface SuperAdmin {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export async function getClients(db: D1Database): Promise<Client[]> {
  const result = await db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all<Client>();
  return result.results;
}

export async function getClient(db: D1Database, id: number): Promise<Client | null> {
  return db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<Client>();
}

export async function createClient(
  db: D1Database,
  data: Pick<Client, 'name' | 'slug' | 'domain' | 'admin_email'>,
): Promise<number> {
  const result = await db
    .prepare('INSERT INTO clients (name, slug, domain, admin_email) VALUES (?, ?, ?, ?)')
    .bind(data.name, data.slug, data.domain, data.admin_email)
    .run();
  return result.meta.last_row_id as number;
}

export async function updateClientStatus(
  db: D1Database,
  id: number,
  status: Client['status'],
  extra?: Partial<Pick<Client, 'worker_name' | 'db_id' | 'r2_bucket'>>,
): Promise<void> {
  const sets = ['status = ?'];
  const values: unknown[] = [status];

  if (extra?.worker_name !== undefined) { sets.push('worker_name = ?'); values.push(extra.worker_name); }
  if (extra?.db_id !== undefined) { sets.push('db_id = ?'); values.push(extra.db_id); }
  if (extra?.r2_bucket !== undefined) { sets.push('r2_bucket = ?'); values.push(extra.r2_bucket); }

  values.push(id);
  await db.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function updateClientLastChecked(db: D1Database, id: number): Promise<void> {
  await db
    .prepare("UPDATE clients SET last_checked = datetime('now') WHERE id = ?")
    .bind(id)
    .run();
}

export async function getSuperAdmins(db: D1Database): Promise<SuperAdmin[]> {
  const result = await db.prepare('SELECT * FROM super_admins ORDER BY created_at DESC').all<SuperAdmin>();
  return result.results;
}

export async function addSuperAdmin(db: D1Database, email: string, name: string): Promise<void> {
  await db
    .prepare('INSERT INTO super_admins (email, name) VALUES (?, ?)')
    .bind(email, name)
    .run();
}

export async function removeSuperAdmin(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM super_admins WHERE id = ?').bind(id).run();
}
