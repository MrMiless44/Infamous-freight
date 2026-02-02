import type { NextApiRequest, NextApiResponse } from "next";

interface HealthResponse {
  ok: boolean;
  node: string;
  supabaseUrlPresent: boolean;
  supabaseAnonPresent: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  const supabaseUrlPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const health: HealthResponse = {
    ok: supabaseUrlPresent && supabaseAnonPresent,
    node: process.version,
    supabaseUrlPresent,
    supabaseAnonPresent,
  };

  const status = health.ok ? 200 : 500;
  return res.status(status).json(health);
}
