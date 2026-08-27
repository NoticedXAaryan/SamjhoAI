export function isProtectedPath(pathname: string) {
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isMeetingIndex = pathname === '/meeting';
  const isMeetingSummary = /^\/meeting\/[^/]+\/summary(?:\/|$)/.test(pathname);
  return isDashboard || isMeetingIndex || isMeetingSummary;
}
