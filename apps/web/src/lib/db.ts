import { supabaseServer } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return { supabase, user: data.user };
}

export async function getMyProfile() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, phone, company_id, is_verified")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
