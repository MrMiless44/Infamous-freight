import { requireUser, getUserCompanies, getActiveCompanyId } from "@/lib/auth-server";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  const companies = await getUserCompanies(user.id);
  const activeCompanyId = await getActiveCompanyId(user.id);
  return jsonWithRequestId(req, { userId: user.id, companies, activeCompanyId });
}
