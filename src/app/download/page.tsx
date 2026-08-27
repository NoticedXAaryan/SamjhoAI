import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Download, Laptop, MonitorDown, Shield, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const options = [
  {
    title: 'Web App',
    description: 'Use Samjho AI in your browser with no installation.',
    icon: Laptop,
    action: 'Open dashboard',
    href: '/dashboard',
    recommended: true,
  },
  {
    title: 'Desktop Package',
    description: 'Archived Electron packaging can be restored from the legacy folder.',
    icon: MonitorDown,
    action: 'View archive',
    href: '/dashboard',
    recommended: false,
  },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <section className="py-16">
          <Badge variant="success" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            Next.js build
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-6xl">Choose how you want to run Samjho AI.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/55">
            The browser app is now the primary experience. Legacy desktop and backend pieces are archived inside the project for later recovery.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.title} className="border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{option.title}</CardTitle>
                    {option.recommended && <Badge variant="success">Recommended</Badge>}
                  </div>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={option.href}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" />
                    {option.action}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 border-cyan-400/20 bg-cyan-400/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-glow" />
              Preserved systems
            </CardTitle>
            <CardDescription>The JWT auth backend, Prisma schema, and old Vite app are saved under `archive/`.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Self-hosted authentication is active
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Landing UI retained
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Legacy code archived
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
