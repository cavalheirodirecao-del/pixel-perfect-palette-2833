import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Store = Database["public"]["Tables"]["stores"]["Row"];
type Seller = Database["public"]["Tables"]["sellers"]["Row"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel — Cavalheiro Camisaria" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-background px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Painel Cavalheiro</h1>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>
      {role.isLoading ? <p className="mt-8">Carregando…</p> : !role.data ? (
        <p className="mt-8 text-muted-foreground">Sua conta não tem acesso de administrador.</p>
      ) : (
        <Tabs defaultValue="stores" className="mt-6">
          <TabsList><TabsTrigger value="stores">Lojas</TabsTrigger><TabsTrigger value="sellers">Vendedores</TabsTrigger><TabsTrigger value="events">Histórico</TabsTrigger></TabsList>
          <TabsContent value="stores"><StoresTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="events"><EventsTab /></TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function useStores() {
  return useQuery({ queryKey: ["stores"], queryFn: async () => {
    const { data, error } = await supabase.from("stores").select("*").order("sort_order");
    if (error) throw error; return data;
  } });
}

const STORE_FIELDS: [keyof Store, string][] = [
  ["name", "Nome"], ["slug", "Slug (URL)"], ["description", "Frase"], ["cover_image", "URL da capa"], ["logo_image", "URL do logo"],
  ["address", "Endereço"], ["maps_url", "Link Google Maps"], ["instagram_url", "Instagram"], ["threads_url", "Threads"],
  ["tiktok_url", "TikTok"], ["general_contact_url", "Contato geral (sem vendedores)"],
];

function StoreForm({ store }: { store: Partial<Store> }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Partial<Store>>(store);
  async function save() {
    const payload = { ...f, name: f.name ?? "", slug: f.slug ?? "" };
    const { error } = store.id
      ? await supabase.from("stores").update(payload).eq("id", store.id)
      : await supabase.from("stores").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Loja salva"); qc.invalidateQueries({ queryKey: ["stores"] });
    if (!store.id) setF({});
  }
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {STORE_FIELDS.map(([k, label]) => (
          <label key={k} className="text-xs text-muted-foreground">{label}
            <Input value={(f[k] as string) ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.active ?? true} onCheckedChange={(v) => setF({ ...f, active: v })} /> Ativa</label>
        <Button onClick={save}>{store.id ? "Salvar" : "Adicionar loja"}</Button>
        {store.slug && <a className="text-sm text-gold underline" href={`/${store.slug}`} target="_blank" rel="noreferrer">Ver página</a>}
      </div>
    </div>
  );
}

function StoresTab() {
  const { data } = useStores();
  return <div className="flex flex-col gap-4">{data?.map((s) => <StoreForm key={s.id} store={s} />)}<h3 className="font-display text-xl">Nova loja</h3><StoreForm store={{}} /></div>;
}

function SellerRow({ seller, stores }: { seller: Partial<Seller>; stores: Store[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Partial<Seller>>(seller);
  async function save() {
    if (!f.store_id || !f.name) return toast.error("Informe nome e loja");
    const payload = { ...f, store_id: f.store_id, name: f.name, rotation_order: Number(f.rotation_order ?? 0) };
    const { error } = seller.id ? await supabase.from("sellers").update(payload).eq("id", seller.id) : await supabase.from("sellers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Vendedor salvo"); qc.invalidateQueries({ queryKey: ["sellers"] });
    if (!seller.id) setF({});
  }
  async function remove() {
    if (!confirm("Excluir vendedor?")) return;
    await supabase.from("sellers").delete().eq("id", seller.id!);
    qc.invalidateQueries({ queryKey: ["sellers"] });
  }
  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-6">
      <Input placeholder="Nome" value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <select className="h-9 rounded-md border bg-background px-2 text-sm" value={f.store_id ?? ""} onChange={(e) => setF({ ...f, store_id: e.target.value })}>
        <option value="">Loja…</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <Input placeholder="Link WhatsApp (https://wa.me/55...)" value={f.whatsapp_url ?? ""} onChange={(e) => setF({ ...f, whatsapp_url: e.target.value })} />
      <Input placeholder="Link atacado" value={f.wholesale_url ?? ""} onChange={(e) => setF({ ...f, wholesale_url: e.target.value })} />
      <Input placeholder="Link varejo" value={f.retail_url ?? ""} onChange={(e) => setF({ ...f, retail_url: e.target.value })} />
      <Input type="number" placeholder="Ordem" value={f.rotation_order ?? 0} onChange={(e) => setF({ ...f, rotation_order: Number(e.target.value) })} />
      <div className="flex items-center gap-3 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.active ?? true} onCheckedChange={(v) => setF({ ...f, active: v })} /> Ativo</label>
        <Button size="sm" onClick={save}>{seller.id ? "Salvar" : "Adicionar vendedor"}</Button>
        {seller.id && <Button size="sm" variant="destructive" onClick={remove}>Excluir</Button>}
        {seller.last_selected_at && <span className="text-xs text-muted-foreground">Último atendimento: {new Date(seller.last_selected_at).toLocaleString("pt-BR")}</span>}
      </div>
    </div>
  );
}

function SellersTab() {
  const stores = useStores().data ?? [];
  const [filter, setFilter] = useState("");
  const { data } = useQuery({ queryKey: ["sellers"], queryFn: async () => {
    const { data, error } = await supabase.from("sellers").select("*").order("rotation_order"); if (error) throw error; return data;
  } });
  const list = (data ?? []).filter((s) => !filter || s.store_id === filter);
  return (
    <div className="flex flex-col gap-3">
      <select className="h-9 w-60 rounded-md border bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Todas as lojas</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {list.map((s) => <SellerRow key={s.id} seller={s} stores={stores} />)}
      <h3 className="font-display text-xl">Novo vendedor</h3>
      <SellerRow seller={{ store_id: filter || undefined }} stores={stores} key={"new" + filter} />
    </div>
  );
}

function EventsTab() {
  const { data } = useQuery({ queryKey: ["events"], queryFn: async () => {
    const { data, error } = await supabase.from("redirect_events").select("id, action_type, created_at, referrer, stores(name), sellers(name)").order("created_at", { ascending: false }).limit(300);
    if (error) throw error; return data;
  } });
  const label: Record<string, string> = { whatsapp: "Consultor", atacado: "Atacado", varejo: "Varejo" };
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-card text-left text-muted-foreground"><tr><th className="p-2">Data</th><th className="p-2">Loja</th><th className="p-2">Vendedor</th><th className="p-2">Tipo</th></tr></thead>
        <tbody>{data?.map((e) => (
          <tr key={e.id} className="border-t">
            <td className="p-2">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
            <td className="p-2">{e.stores?.name ?? "—"}</td>
            <td className="p-2">{e.sellers?.name ?? <span className="text-destructive">Indisponível</span>}</td>
            <td className="p-2">{label[e.action_type] ?? e.action_type}</td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
