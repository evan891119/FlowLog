import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
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
          Use your email to get a magic link. Once signed in, your tasks sync across devices through your own account.
        </p>

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
            Send magic link
          </button>
        </form>

        {resolvedSearchParams.message ? (
          <p className="mt-4 rounded-2xl border border-sand bg-mist/60 px-4 py-3 text-sm text-steel">{resolvedSearchParams.message}</p>
        ) : null}
      </div>
    </main>
  );
}
