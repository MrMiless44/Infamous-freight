import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Environment variable NEXT_PUBLIC_SUPABASE_URL is not set. Please configure it to initialize the Supabase client.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please configure it to initialize the Supabase client.",
  );
}

// Type-asserted validated env vars
const validatedUrl: string = supabaseUrl;
const validatedKey: string = supabaseAnonKey;

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(validatedUrl, validatedKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components are read-only; ignore cookie setting errors
        }
      },
    },
  });
}
