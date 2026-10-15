import { createFileRoute, notFound } from "@tanstack/react-router";
import { getStore } from "@/lib/stores.functions";
import { StorePage } from "@/components/StorePage";

export const Route = createFileRoute("/$slug")({
  validateSearch: (s: Record<string, unknown>): { indisponivel?: number } => (s.indisponivel ? { indisponivel: 1 } : {}),
  loader: async ({ params }) => {
    const store = await getStore({ data: { slug: params.slug } });
    if (!store) throw notFound();
    return { store };
  },
  head: ({ loaderData }) => {
    const n = loaderData?.store.name;
    const title = n ? `Cavalheiro Camisaria ${n}` : "Cavalheiro Camisaria";
    const desc = "Fale com um consultor, compre no atacado ou varejo e encontre nossa loja.";
    return { meta: [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: Page,
});

function Page() {
  const { store } = Route.useLoaderData();
  const { indisponivel } = Route.useSearch();
  return <StorePage store={store} unavailable={!!indisponivel} generalContact={store.general_contact_url} />;
}
