import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Painel Cavalheiro" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Conta criada. Confirme seu e-mail para entrar.");
      setMode("in");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-background px-6">
      <h1 className="font-display text-3xl font-semibold">Painel administrativo</h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <Button disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
      </form>
      <button className="mt-4 text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Criar conta" : "Já tenho conta"}
      </button>
    </main>
  );
}
