import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await req.json();

    const loadId = (body?.load_id as string | undefined) ?? null;
    const assignmentId = (body?.assignment_id as string | undefined) ?? null;
    const otherUserId = body?.other_user_id as string | undefined;

    if (!loadId && !assignmentId) {
      throw new Error("load_id or assignment_id required");
    }
    if (!otherUserId) {
      throw new Error("other_user_id required");
    }

    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({ load_id: loadId, assignment_id: assignmentId, created_by: user.id })
      .select("id")
      .single();
    if (threadError) {
      throw threadError;
    }

    const { error: participantError } = await supabase
      .from("thread_participants")
      .insert([
        { thread_id: thread.id, user_id: user.id },
        { thread_id: thread.id, user_id: otherUserId },
      ]);
    if (participantError) {
      throw participantError;
    }

    return NextResponse.json({ ok: true, thread_id: thread.id });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 400 },
    );
  }
}
