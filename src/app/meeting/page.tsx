import { redirect } from 'next/navigation';

export default function MeetingIndexPage() {
  redirect('/meeting/default-room');
}
