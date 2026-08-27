import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function MeetingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  return children;
}
