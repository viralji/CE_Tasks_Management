import { pool } from './db';

export async function resolveOrgIdBySlug(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const { rows } = await pool.query('SELECT id FROM organization WHERE slug = $1', [slug]);
  return rows[0]?.id ?? null;
}

export function orgSlugFromHeaders(headers: Headers): string | null {
  const slug = headers.get('x-org');
  return slug && slug !== '' ? slug : null;
}


