export default function MeetingLayout({ children }: { children: React.ReactNode }) {
  // Meeting links are intentionally public so guests can reach the pre-join screen.
  // Protected meeting routes (the index and summaries) are enforced by the proxy.
  return children;
}
