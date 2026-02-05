import { z } from "zod";
import { requireUser, getUserCompanies } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const Body = z.object({ companyId: z.string().uuid() });

export async function POST(req: Request) {
  const user = await requireUser(req);
  const { companyId } = Body.parse(await req.json());

  const companies = await getUserCompanies(user.id);
  if (!companies.some((company) => company.company_id === companyId)) {
    return jsonWithRequestId(req, { error: "Not a member of that company" }, { status: 403 });
  }

  await supabaseAdmin.from("profiles").upsert({ user_id: user.id, active_company_id: companyId });
  return jsonWithRequestId(req, { ok: true, activeCompanyId: companyId });
}
