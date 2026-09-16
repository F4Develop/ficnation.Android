import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gcxefgltwcyeeerbvzvj.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_sJETGv900KT5N0hX1r9cvQ_tpj0pR3D";

  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return clientInstance;
}
