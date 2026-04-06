import test from "node:test";
import assert from "node:assert/strict";
import { parseThemePreference, resolveThemePreference } from "@/lib/theme";

test("parseThemePreference falls back to system", () => {
  assert.equal(parseThemePreference("light"), "light");
  assert.equal(parseThemePreference("dark"), "dark");
  assert.equal(parseThemePreference("system"), "system");
  assert.equal(parseThemePreference("unexpected"), "system");
  assert.equal(parseThemePreference(null), "system");
});

test("resolveThemePreference respects manual and system settings", () => {
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference("dark", false), "dark");
  assert.equal(resolveThemePreference("system", true), "dark");
  assert.equal(resolveThemePreference("system", false), "light");
});
