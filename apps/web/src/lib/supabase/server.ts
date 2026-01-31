import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const supabaseServer = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // In Server Components, `cookies()` is read-only. We expose no-op
        // setters here to avoid runtime errors when Supabase tries to
        // refresh the session and write cookies.
        set(_name, _value, _options) {
          // no-op: cookie mutation is not supported in this context
        },
        remove(_name, _options) {
          // no-op: cookie mutation is not supported in this context
        },
      },
    }
  );
};
