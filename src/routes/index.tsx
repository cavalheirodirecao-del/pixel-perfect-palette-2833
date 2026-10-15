import { createFileRoute, Link } from "@tanstack/react-router";
import { listStores } from "@/lib/stores.functions";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/")({
  loader: () => listStores(),
  head: () => ({ meta: [
    { title: "Cavalheiro Camisaria — Nossas lojas" },
    { name: "description", content: "Escolha a unidade Cavalheiro Camisaria mais próxima de você." },
    { property: "og:title", content: "Cavalheiro Camisaria — Nossas lojas" },
    { property: "og:description", content: "Escolha a unidade Cavalheiro Camisaria mais próxima de você." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Index,
});

function Index() {
  const stores = Route.useLoaderData();
  return (
    <main className="mx-auto min-h-screen w-full max-w-[480px] bg-background px-6 py-12 text-center">
      <img src={logo} alt="Cavalheiro Camisaria" width={128} height={128} className="mx-auto h-32 w-32 rounded-full border-2 border-gold" />
      <h1 className="mt-6 font-display text-4xl font-semibold">Nossas lojas</h1>
      <p className="mt-2 text-sm text-muted-foreground">Escolha a sua unidade</p>
      <nav className="mt-8 flex flex-col gap-3">
        {stores.map((s) => (
          <Link key={s.slug} to="/$slug" params={{ slug: s.slug }} search={{}} className="link-card font-display text-xl font-semibold">{s.name}</Link>
        ))}
      </nav>
    </main>
  );
}
