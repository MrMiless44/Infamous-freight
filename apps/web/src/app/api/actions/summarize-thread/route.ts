import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireUser();
    const body = await req.json();
    const threadId = body?.thread_id as string;
    if (!threadId) {
      throw new Error("thread_id required");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }
    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error("Missing access token");
    }

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    if (!projectRef) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable is not set");
    }
    const url = `https://${projectRef}.functions.supabase.co/summarize-thread`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ thread_id: threadId, max_messages: 80 }),
    });

    const json = await resp.json();
    if (!resp.ok || !json.ok) {
      throw new Error(json?.error || "Edge summary failed");
    }

    return NextResponse.json({ ok: true, summary: json.summary });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 400 },
    );
  }
}
