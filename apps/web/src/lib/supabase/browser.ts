"use client";

import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please set it in your environment configuration."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please set it in your environment configuration."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
