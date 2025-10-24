import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { DashboardClient } from './DashboardClient';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="card-standard text-sm">
        You are not signed in. <Link className="underline text-primary hover:text-primary/80" href="/signin">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-600">Project and task metrics</p>
      </div>
      
      <DashboardClient />
    </div>
  );
}


