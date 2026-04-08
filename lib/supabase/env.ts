function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string) {
  const value = process.env[name];
  return value ? value : null;
}

export function getSupabaseUrl() {
  return readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getOptionalSupabaseUrl() {
  return readOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getOptionalSupabaseAnonKey() {
  return readOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
