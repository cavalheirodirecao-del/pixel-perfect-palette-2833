import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const COLS =
  "name, slug, description, cover_image, logo_image, address, maps_url, instagram_url, threads_url, tiktok_url, general_contact_url";

export const getStore = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: s } = await publicClient().from("stores").select(COLS).eq("slug", data.slug).eq("active", true).maybeSingle();
    return s;
  });

export const listStores = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("stores").select("name, slug").eq("active", true).order("sort_order");
  return data ?? [];
});
