import { NextResponse } from "next/server";
import { getSafeInitialState } from "@/lib/dashboard-state";
import { loadDashboardStateForUser, saveDashboardStateForUser } from "@/lib/dashboard-cloud";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadDashboardStateForUser(supabase, user.id);
  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const state = getSafeInitialState(payload);

  await saveDashboardStateForUser(supabase, user.id, state);

  return NextResponse.json({ ok: true });
}
