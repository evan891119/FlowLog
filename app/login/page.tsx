import { redirect } from "next/navigation";
import { buildLoginUrl, getLoginStep } from "@/lib/auth-otp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    message?: string;
    step?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const email = resolvedSearchParams.email;
  const loginStep = getLoginStep(resolvedSearchParams.step, email);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-panel backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-steel">FlowLog Cloud</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-3 text-base text-steel">
          Use your email to receive a verification code. This works cleanly even if you read email on your phone and sign in on your computer.
        </p>

        {loginStep === "verify" && email ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-sand bg-mist/60 px-4 py-3 text-sm text-steel">
              Code sent to <span className="font-medium text-ink">{email}</span>
            </div>

            <form action="/auth/verify" method="post" className="space-y-4">
              <input type="hidden" name="email" value={email} />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Verification code</span>
                <input
                  type="text"
                  name="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="w-full rounded-2xl bg-mist px-4 py-3 text-base text-ink outline-none placeholder:text-steel/70"
                  placeholder="123456"
                />
              </label>

              <button type="submit" className="w-full rounded-full bg-clay px-4 py-3 text-sm font-semibold text-white">
                Verify code
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <form action="/auth/login" method="post" className="flex-1 min-w-[10rem]">
                <input type="hidden" name="email" value={email} />
                <button
                  type="submit"
                  className="w-full rounded-full border border-sand bg-white px-4 py-3 text-sm font-semibold text-ink"
                >
                  Resend code
                </button>
              </form>

              <a
                href={buildLoginUrl()}
                className="flex-1 min-w-[10rem] rounded-full border border-sand bg-white px-4 py-3 text-center text-sm font-semibold text-ink"
              >
                Use another email
              </a>
            </div>
          </div>
        ) : (
          <form action="/auth/login" method="post" className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-2xl bg-mist px-4 py-3 text-base text-ink outline-none placeholder:text-steel/70"
                placeholder="you@example.com"
              />
            </label>

            <button type="submit" className="w-full rounded-full bg-clay px-4 py-3 text-sm font-semibold text-white">
              Send code
            </button>
          </form>
        )}

        {resolvedSearchParams.message ? (
          <p className="mt-4 rounded-2xl border border-sand bg-mist/60 px-4 py-3 text-sm text-steel">{resolvedSearchParams.message}</p>
        ) : null}
      </div>
    </main>
  );
}
