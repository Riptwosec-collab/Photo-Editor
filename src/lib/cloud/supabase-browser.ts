import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CloudConfiguration = {
  url: string;
  publishableKey: string;
};

let browserClient: SupabaseClient | null = null;

export function getCloudConfiguration(): CloudConfiguration | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function isCloudConfigured() {
  return getCloudConfiguration() !== null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const configuration = getCloudConfiguration();
  if (!configuration) return null;

  browserClient = createClient(configuration.url, configuration.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        "x-client-info": "lumaforge-ai-studio-web",
      },
    },
  });
  return browserClient;
}
