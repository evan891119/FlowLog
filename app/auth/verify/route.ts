import { redirect } from "next/navigation";
import { buildLoginUrl, normalizeEmailInput, normalizeOtpToken } from "@/lib/auth-otp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmailInput(formData.get("email"));
  const token = normalizeOtpToken(formData.get("token"));

  if (!email) {
    redirect(buildLoginUrl({ message: "Enter an email address." }));
  }

  if (!token) {
    redirect(
      buildLoginUrl({
        step: "verify",
        email,
        message: "Enter the verification code.",
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    redirect(
      buildLoginUrl({
        step: "verify",
        email,
        message: error.message,
      }),
    );
  }

  redirect("/");
}
