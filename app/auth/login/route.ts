import { redirect } from "next/navigation";
import { buildLoginUrl, normalizeEmailInput } from "@/lib/auth-otp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmailInput(formData.get("email"));

  if (!email) {
    redirect(buildLoginUrl({ message: "Enter an email address." }));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
  });

  if (error) {
    redirect(buildLoginUrl({ message: error.message }));
  }

  redirect(
    buildLoginUrl({
      step: "verify",
      email,
      message: "Enter the verification code sent to your email.",
    }),
  );
}
