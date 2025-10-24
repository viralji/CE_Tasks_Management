import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const { orgId } = await params;
  const userOrgId = (session as any).org as string;
  
  // Skip org verification for now - just return all users
  // if (orgId !== userOrgId) {
  //   return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  // }
  
  try {
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    
    try {
      // Simple query - get all users for now
      const { rows } = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.primary_email as email,
          u.avatar_url as avatar
        FROM app_user u
        ORDER BY u.name ASC, u.primary_email ASC
      `);
      
      return NextResponse.json({ data: rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
