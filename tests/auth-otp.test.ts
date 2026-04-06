import test from "node:test";
import assert from "node:assert/strict";
import { buildLoginUrl, getLoginStep, normalizeEmailInput, normalizeOtpToken } from "@/lib/auth-otp";

test("buildLoginUrl includes verify state and email", () => {
  const url = buildLoginUrl({
    step: "verify",
    email: "you@example.com",
    message: "Enter the verification code sent to your email.",
  });

  assert.equal(
    url,
    "/login?step=verify&email=you%40example.com&message=Enter+the+verification+code+sent+to+your+email.",
  );
});

test("buildLoginUrl omits verify state when email is missing", () => {
  assert.equal(buildLoginUrl({ step: "verify" }), "/login");
});

test("getLoginStep only returns verify when email is present", () => {
  assert.equal(getLoginStep("verify", "you@example.com"), "verify");
  assert.equal(getLoginStep("verify", undefined), "request");
  assert.equal(getLoginStep("request", "you@example.com"), "request");
});

test("normalizeEmailInput trims and rejects empty values", () => {
  assert.equal(normalizeEmailInput("  you@example.com  "), "you@example.com");
  assert.equal(normalizeEmailInput("   "), null);
  assert.equal(normalizeEmailInput(null), null);
});

test("normalizeOtpToken trims and rejects empty values", () => {
  assert.equal(normalizeOtpToken(" 123456 "), "123456");
  assert.equal(normalizeOtpToken(""), null);
  assert.equal(normalizeOtpToken(null), null);
});
