import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { loadDashboardStateForUser } from "@/lib/dashboard-cloud";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialState = await loadDashboardStateForUser(supabase, user.id);

  return <Dashboard initialState={initialState} userEmail={user.email ?? null} />;
}
