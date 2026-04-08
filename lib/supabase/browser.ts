"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getOptionalSupabaseAnonKey, getOptionalSupabaseUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function createOptionalSupabaseBrowserClient() {
  const url = getOptionalSupabaseUrl();
  const anonKey = getOptionalSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
