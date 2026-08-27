import Link from 'next/link';
import { ArrowLeft, Captions, Link2, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AuthForm } from './AuthForm';

const benefits = [
  { Icon: Captions, title: 'Captions together', detail: 'Everyone follows the same conversation in realtime.' },
  { Icon: Link2, title: 'Guests join by link', detail: 'Invite people without forcing another account.' },
  { Icon: ShieldCheck, title: 'Your deployment', detail: 'Keep meetings and account data under your control.' },
];

export function AuthExperience({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignUp = mode === 'sign-up';

  return (
    <main className="min-h-screen bg-[#050507] p-3 text-white sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-[0_32px_120px_rgba(0,0,0,0.65)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr] lg:rounded-[2.5rem]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#08080b] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-[120px]" />
          <div className="absolute -bottom-36 -right-32 h-[480px] w-[480px] rounded-full bg-fuchsia-500/20 blur-[135px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(112,92,255,0.16),transparent_48%)]" />
          <div className="absolute left-1/2 top-[45%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-[45%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />

          <div className="relative z-10">
            <Link href="/" aria-label="Back to Samjho AI home" className="inline-flex">
              <BrandLogo priority className="h-14 w-auto" />
            </Link>
          </div>

          <div className="relative z-10 max-w-xl py-14">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-black/35 p-4 shadow-[0_0_70px_rgba(112,92,255,0.22)] backdrop-blur-2xl">
              <BrandLogo compact className="h-full w-full" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Understand everyone</p>
            <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.045em] xl:text-6xl">
              {isSignUp ? 'Begin with a meeting built for everyone.' : 'Return to conversations without barriers.'}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55">
              Live captions, link-based guest access, and clear controls keep the room focused on people—not setup.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {benefits.map(({ Icon, title, detail }, index) => (
              <div key={title} className="min-h-36 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <span className="text-[10px] text-white/30">0{index + 1}</span>
                </div>
                <p className="mt-5 text-sm font-medium text-white/85">{title}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex min-h-[calc(100vh-1.5rem)] items-center justify-center overflow-hidden px-5 py-10 sm:px-10 lg:min-h-0 lg:px-14 xl:px-20">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="relative z-10 w-full max-w-md">
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" aria-label="Back to home" className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
              <BrandLogo compact className="h-9 w-9 lg:hidden" />
            </div>
            <AuthForm mode={mode} />
          </div>
        </section>
      </div>
    </main>
  );
}
