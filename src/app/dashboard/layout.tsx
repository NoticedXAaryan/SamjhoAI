import { redirect } from 'next/navigation';
import { getSession } from '@/features/auth/session';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  return children;
}
