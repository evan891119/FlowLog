export type LoginStep = "request" | "verify";

type LoginUrlOptions = {
  step?: LoginStep;
  email?: string;
  message?: string;
};

export function normalizeEmailInput(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim();
  return email.length > 0 ? email : null;
}

export function normalizeOtpToken(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const token = value.trim();
  return token.length > 0 ? token : null;
}

export function getLoginStep(step: string | undefined, email: string | undefined): LoginStep {
  return step === "verify" && typeof email === "string" && email.length > 0 ? "verify" : "request";
}

export function buildLoginUrl({ step, email, message }: LoginUrlOptions = {}) {
  const params = new URLSearchParams();

  if (step === "verify" && email) {
    params.set("step", "verify");
    params.set("email", email);
  }

  if (message) {
    params.set("message", message);
  }

  const query = params.toString();
  return query.length > 0 ? `/login?${query}` : "/login";
}
