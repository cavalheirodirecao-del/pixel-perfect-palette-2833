import { createFileRoute } from "@tanstack/react-router";
import { publicClient } from "@/lib/stores.functions";

const TYPES = ["whatsapp", "atacado", "varejo"];

export const Route = createFileRoute("/redirect/$loja/$tipo")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!TYPES.includes(params.tipo)) return new Response("Not found", { status: 404 });
        const { data, error } = await publicClient().rpc("pick_seller", {
          _slug: params.loja,
          _action: params.tipo,
          _ua: (request.headers.get("user-agent") ?? "").slice(0, 400),
          _ref: (request.headers.get("referer") ?? "").slice(0, 400),
        });
        const row = Array.isArray(data) ? data[0] : null;
        const headers = { "Cache-Control": "no-store" };
        if (!error && row?.url) return new Response(null, { status: 302, headers: { ...headers, Location: row.url } });
        const u = new URL(`/${params.loja}`, request.url);
        u.searchParams.set("indisponivel", "1");
        return new Response(null, { status: 302, headers: { ...headers, Location: u.toString() } });
      },
    },
  },
});
