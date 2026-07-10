import React from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import { useSignIn } from '@/hooks/useSignIn';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { Target, TrendingUp, Users, ShieldCheck } from 'lucide-react';

const HIGHLIGHTS = [
  { Icon: Target, title: 'Goals that ship', body: 'OKRs, key results, and progress \u2014 in one place.' },
  { Icon: TrendingUp, title: 'Track daily momentum', body: 'Habits, tasks, and weekly outputs with real analytics.' },
  { Icon: Users, title: 'Team-aware', body: 'Assign, collaborate, and see what your team is shipping.' },
  { Icon: ShieldCheck, title: 'Private by default', body: 'Row-level security and role-based access baked in.' },
];

const SignIn = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    handleSignIn,
  } = useSignIn();

  useAuthCheck();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden text-primary-foreground p-12">
        {/* Layered gradient background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(1200px 600px at -10% -20%, hsl(220 90% 56% / 0.65), transparent 60%),' +
              'radial-gradient(900px 700px at 110% 110%, hsl(170 80% 45% / 0.55), transparent 55%),' +
              'linear-gradient(160deg, hsl(230 60% 12%), hsl(230 55% 20%))',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0 1px, transparent 1px),' +
              'radial-gradient(circle at 70% 60%, rgba(255,255,255,0.05) 0 1px, transparent 1px)',
            backgroundSize: '40px 40px, 60px 60px',
          }}
        />

        <div className="flex items-center gap-3 text-white">
          <Wordmark />
        </div>

        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Personal & Team OS</p>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Build better habits. <br />
              Ship better goals.
            </h2>
            <p className="text-white/70 text-base">
              BetterMe brings your daily execution and long-term goals into one calm, focused workspace.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white/10 backdrop-blur p-2 border border-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          &copy; {new Date().getFullYear()} BetterMe \u00b7 Better and Co.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile wordmark */}
          <div className="lg:hidden flex justify-center mb-8 text-foreground">
            <Wordmark />
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your BetterMe workspace to keep the momentum going.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
            <SignInForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              onSubmit={handleSignIn}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Trouble signing in? Ask your workspace admin to reset your temporary password.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
