import { supabaseAnon, supabaseAdmin } from "@/lib/supabase";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new HttpError(401, "Unauthorized");

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Unauthorized");
  return data.user;
}

export async function getUserCompanies(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || !data.organization_id) return [];

  return [
    {
      company_id: data.organization_id,
      // Role information is not stored on the users table; keep it nullable
      // to preserve the original return shape.
      role: null as any,
    },
  ];
}

export async function getActiveCompanyId(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("active_company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.active_company_id) return profile.active_company_id as string;

  const companies = await getUserCompanies(userId);
  const first = companies[0]?.company_id;
  if (!first) return null;

  await supabaseAdmin.from("profiles").upsert({ user_id: userId, active_company_id: first });
  return first as string;
}

export async function requireActiveCompany(req: Request) {
  const user = await requireUser(req);
  const activeCompanyId = await getActiveCompanyId(user.id);
  if (!activeCompanyId) throw new HttpError(403, "No company membership");
  return { user, activeCompanyId };
}

export async function requireCompanyMember(companyId: string, userId: string) {
  const { data: membership } = await supabaseAdmin
    .from("company_memberships")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) throw new HttpError(403, "Forbidden");
  return membership;
}

export async function requireCompanyRole(
  companyId: string,
  userId: string,
  allowedRoles: string[],
) {
  const membership = await requireCompanyMember(companyId, userId);
  if (!allowedRoles.includes(membership.role)) {
    throw new HttpError(403, "Forbidden");
  }

  return membership;
}
