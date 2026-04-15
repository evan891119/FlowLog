import { NextResponse } from "next/server";
import {
  deleteTaskForUser,
  loadDashboardStateForUser,
  type DashboardMutationRequest,
  upsertDashboardSettingsForUser,
  upsertTaskRowsForUser,
} from "@/lib/dashboard-cloud";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await loadDashboardStateForUser(supabase, user.id);
    return NextResponse.json(state);
  } catch (error: any) {
    console.error("[GET /api/dashboard]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as DashboardMutationRequest;

    if (payload.type === "upsert_tasks") {
      await upsertTaskRowsForUser(supabase, user.id, payload.taskRows);
      return NextResponse.json({ ok: true });
    }

    if (payload.type === "delete_task") {
      await deleteTaskForUser(supabase, user.id, payload.taskId, payload.deletedAt);
      return NextResponse.json({ ok: true });
    }

    if (payload.type === "upsert_settings") {
      await upsertDashboardSettingsForUser(supabase, user.id, payload.settingsRow);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid dashboard mutation." }, { status: 400 });
  } catch (error: any) {
    console.error("[PUT /api/dashboard]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
