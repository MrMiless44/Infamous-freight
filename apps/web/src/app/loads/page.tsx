import { supabaseServer } from "@/lib/supabase/server";
import LoadCard from "@/components/LoadCard";

export default async function LoadsPage() {
  const supabase = supabaseServer();
  const { data: loads, error } = await supabase
    .from("loads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (
    <div className="marketplace-stack">
      <h1 className="marketplace-title">Loads</h1>
      <div className="marketplace-grid">
        {(loads ?? []).map((load) => (
          <LoadCard key={load.id} load={load} />
        ))}
      </div>
    </div>
  );
}
