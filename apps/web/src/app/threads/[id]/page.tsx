import Chat from "@/components/Chat";
import ThreadSummaryButton from "@/components/ThreadSummaryButton";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const threadId = params.id;

  const { data: msgs, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    throw error;
  }

  const { data: summaryRow } = await supabase
    .from("thread_summaries")
    .select("summary, updated_at")
    .eq("thread_id", threadId)
    .maybeSingle();

  return (
    <div className="marketplace-stack">
      <div className="marketplace-thread-header">
        <div>
          <h1 className="marketplace-title">Thread</h1>
          <p className="marketplace-muted">{threadId}</p>
        </div>
        <ThreadSummaryButton threadId={threadId} />
      </div>

      {summaryRow?.summary && (
        <div className="card marketplace-card">
          <div className="marketplace-card-title">Latest Summary</div>
          <div className="marketplace-muted">
            Updated: {summaryRow.updated_at ? new Date(summaryRow.updated_at).toLocaleString() : "N/A"}
          </div>
          <pre className="marketplace-summary">{summaryRow.summary}</pre>
        </div>
      )}

      <Chat threadId={threadId} initialMessages={(msgs ?? []) as any} />
    </div>
  );
}
